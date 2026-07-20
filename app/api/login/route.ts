import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Signup stores the email normalized, so look it up the same way.
    const user = await prisma.user.findUnique({
      where: {
        email: String(email).toLowerCase().trim(),
      },
    });

    // Unknown email and wrong password answer identically, so the response
    // can't be used to discover which emails have accounts.
    // Stored passwords are bcrypt hashes, so they must be compared, not equated.
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { message: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}