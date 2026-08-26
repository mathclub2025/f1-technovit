import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, teamId, password } = body;

    // Verify Admin Password
    if (role === "admin") {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword || password !== adminPassword) {
        return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
      }
    }

    const secret = process.env.SHARED_JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const encodedSecret = new TextEncoder().encode(secret);

    const token = await new SignJWT({
      email: email || "admin@example.com",
      teamId: teamId || null,
      role: role || "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("12h")
      .sign(encodedSecret);

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
