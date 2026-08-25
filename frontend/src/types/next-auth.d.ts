import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      teamId?: string;
      role?: "team" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    teamId?: string;
    role?: "team" | "admin";
  }
}
