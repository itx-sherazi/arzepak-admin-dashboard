/** Override in `.env.local` for local dev. */
function stripTrailingSlash(u: string) {
  return u.replace(/\/$/, "");
}

export const apiUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "https://api.arzepak.com/api");
export const mainAppUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://arzepak.com");
