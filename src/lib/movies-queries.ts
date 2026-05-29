import { queryOptions } from "@tanstack/react-query";

import { getMoviesByCategoryFn, getMoviesByIdsFn } from "@/lib/movies.functions";

export const moviesByCategoryQueryOptions = () =>
  queryOptions({
    queryKey: ["movies", "by-category"],
    queryFn: () => getMoviesByCategoryFn(),
    staleTime: 5 * 60 * 1000,
  });

export const moviesByIdsQueryOptions = (ids: string[]) =>
  queryOptions({
    queryKey: ["movies", "by-ids", [...ids].sort().join(",")],
    queryFn: () => getMoviesByIdsFn({ data: { ids } }),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
