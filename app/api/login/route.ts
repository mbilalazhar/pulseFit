import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createToken } from "@/lib/auth";

const REDIRECTS = {
  ADMIN: "/dashboard",
  TRAINER: "/trainer",
  MEMBER: "/user",
} as const;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Both Email and Password are Required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { message: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    const token = await createToken({
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    });

    const res = NextResponse.json(
      {
        message: "Login successful",
        redirectTo: REDIRECTS[user.role],
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
    console.log(`id : ${user.id} and email: ${user.email} and role: ${user.role}`)
    res.cookies.set("token", token, {
      httpOnly: true,                                  // JS can't read it
      secure: process.env.NODE_ENV === "production",   // https only in prod
      sameSite: "lax",                                 // CSRF protection
      path: "/",
      maxAge: 60 * 60 * 24 * 7,                        // 7 days
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}