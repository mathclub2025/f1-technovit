/**
 * Next.js Middleware — Route protection via NextAuth.
 *
 * - /team/* requires any authenticated user
 * - /admin/* requires role === "admin"
 * - All other routes are public
 *
 * This file MUST live at the project root (next to package.json),
 * NOT inside src/.
 */
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) return false;
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return token.role === "admin";
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/team/:path*", "/admin/:path*"],
};
