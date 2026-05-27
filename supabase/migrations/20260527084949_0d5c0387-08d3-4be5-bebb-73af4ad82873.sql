
-- Revoke default public EXECUTE on our SECURITY DEFINER functions, then
-- grant only to the application roles that need them (RLS policies need
-- has_role; the signup trigger owns handle_new_user).
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- handle_new_user only runs as a trigger; no role needs direct EXECUTE.
