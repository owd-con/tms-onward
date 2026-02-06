export function makeUrl(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
) {
  if (!params) return path;

  const query = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");

  return query ? `${path}?${query}` : path;
}
