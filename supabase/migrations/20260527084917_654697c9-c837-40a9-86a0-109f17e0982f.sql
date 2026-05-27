
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.movie_category AS ENUM ('now_showing', 'coming_soon', 'popular');

-- ============ TIMESTAMP HELPER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ MOVIES ============
CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  poster_url TEXT,
  backdrop_url TEXT,
  category public.movie_category NOT NULL,
  genres TEXT[] NOT NULL DEFAULT '{}',
  duration_minutes INTEGER,
  release_date DATE,
  overview TEXT,
  tmdb_popularity NUMERIC,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_movies_category ON public.movies(category);
CREATE INDEX idx_movies_popularity ON public.movies(tmdb_popularity DESC NULLS LAST);

GRANT SELECT ON public.movies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO authenticated;
GRANT ALL ON public.movies TO service_role;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_movies_updated_at BEFORE UPDATE ON public.movies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CINEMAS ============
CREATE TABLE public.cinemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  base_price NUMERIC(8, 2) NOT NULL DEFAULT 15.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cinemas_active ON public.cinemas(is_active);

GRANT SELECT ON public.cinemas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cinemas TO authenticated;
GRANT ALL ON public.cinemas TO service_role;
ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_cinemas_updated_at BEFORE UPDATE ON public.cinemas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SHOWTIMES ============
CREATE TABLE public.showtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cinema_id UUID NOT NULL REFERENCES public.cinemas(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  price NUMERIC(8, 2),
  screen_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_showtimes_movie_starts ON public.showtimes(movie_id, starts_at);
CREATE INDEX idx_showtimes_cinema_starts ON public.showtimes(cinema_id, starts_at);
CREATE INDEX idx_showtimes_starts ON public.showtimes(starts_at);

GRANT SELECT ON public.showtimes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showtimes TO authenticated;
GRANT ALL ON public.showtimes TO service_role;
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_showtimes_updated_at BEFORE UPDATE ON public.showtimes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger (no CHECK with now())
CREATE OR REPLACE FUNCTION public.validate_showtime()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.starts_at < now() - INTERVAL '1 day' THEN
    RAISE EXCEPTION 'Showtime starts_at must not be more than 1 day in the past';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_showtimes_validate BEFORE INSERT ON public.showtimes
FOR EACH ROW EXECUTE FUNCTION public.validate_showtime();

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role checker (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ RLS POLICIES ============

-- movies: public read, admin write
CREATE POLICY "Anyone can view movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Admins insert movies" ON public.movies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update movies" ON public.movies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete movies" ON public.movies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- cinemas: public read only active, admin sees all + writes
CREATE POLICY "Anyone can view active cinemas" ON public.cinemas FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert cinemas" ON public.cinemas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update cinemas" ON public.cinemas FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete cinemas" ON public.cinemas FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- showtimes: public read of upcoming only, admin writes
CREATE POLICY "Anyone can view upcoming showtimes" ON public.showtimes FOR SELECT
  USING (starts_at >= now() - INTERVAL '6 hours' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert showtimes" ON public.showtimes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update showtimes" ON public.showtimes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete showtimes" ON public.showtimes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- profiles: own row only
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles: users can see their own roles only (admin checks go through has_role)
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
