/**
 * /api/token — Mints a short-lived HS256 JWT for the FastAPI backend.
 *
 * Called once after NextAuth login. The returned token is cached client-side
 * and attached to every fetch/WebSocket to FastAPI as:
 *   - REST: Authorization: Bearer <token>
 *   - WebSocket: ?token=<token>
 *
 * Payload shape matches backend/models.py TokenPayload:
 *   { email: string, teamId?: string, role: "team" | "admin" }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SignJWT } from "jose";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const secret = process.env.SHARED_JWT_SECRET;
  if (!secret) {
    console.error("[/api/token] SHARED_JWT_SECRET is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const encodedSecret = new TextEncoder().encode(secret);

  const token = await new SignJWT({
    email: session.user.email,
    teamId: session.user.teamId ?? null,
    role: session.user.role ?? "team",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(encodedSecret);

  return NextResponse.json({ token });
}
