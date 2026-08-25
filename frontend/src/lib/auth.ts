/**
 * NextAuth Configuration
 *
 * GoogleProvider + participant-list verification.
 * Only @vitstudent.ac.in emails that exist in the participant DB are allowed.
 *
 * DB dependency: imports a `getParticipantByEmail` function from `@/lib/db`.
 * Until the DB teammate pushes her file, a stub is used that always rejects.
 */
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

// ---- DB contract ----------------------------------------------------------
// YAshika to push `@/lib/db` exporting something like:
//   export async function getParticipantByEmail(email: string):
//     Promise<{ teamId: string; role: "team" | "admin" } | null>
//
// Until that file lands, we use a local stub so auth.ts compiles and can be
// swapped over with a single import change.
// ---------------------------------------------------------------------------

type ParticipantRecord = {
  teamId: string;
  role: "team" | "admin";
};

// --- Stub: replace this import once lib/db.ts lands ---
async function getParticipantByEmail(
  email: string
): Promise<ParticipantRecord | null> {
  // TODO: replace with real DB lookup from @/lib/db
  // import { getParticipantByEmail } from "@/lib/db";
  console.warn(
    `[auth] DB stub called for ${email} — rejecting. Replace with real DB lookup.`
  );
  return null;
}

// ---- NextAuth options -----------------------------------------------------

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * signIn: Gate login to @vitstudent.ac.in emails in the participant DB.
     */
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      // Domain restriction
      // if (!email.endsWith("@vitstudent.ac.in")) {
      //   return false;
      // }

      // Participant table lookup
      const participant = await getParticipantByEmail(email);
      if (!participant) {
        return false;
      }

      return true;
    },

    /**
     * jwt: On first sign-in, stash teamId + role from the participant DB
     * onto the JWT token so they're available in every subsequent request.
     */
    async jwt({ token, user, trigger }) {
      // `user` is only present on the very first sign-in
      if (user && user.email) {
        const email = user.email.toLowerCase();
        const participant = await getParticipantByEmail(email);
        if (participant) {
          token.teamId = participant.teamId;
          token.role = participant.role;
        }
      }
      return token;
    },

    /**
     * session: Copy teamId + role from the JWT onto session.user so
     * client-side code can read them via useSession().
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.teamId = token.teamId as string | undefined;
        session.user.role = token.role as "team" | "admin" | undefined;
      }
      return session;
    },
  },
};
