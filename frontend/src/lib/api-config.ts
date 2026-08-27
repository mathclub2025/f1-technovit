export function getApiUrl(path: string = ""): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "https://f1-technovit.onrender.com";
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
