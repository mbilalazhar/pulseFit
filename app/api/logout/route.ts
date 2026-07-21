import { NextResponse } from "next/server";

export async function POST() {
    try {
        const res = NextResponse.json({message: "Logged Out"})
        res.cookies.set("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        });
        return res;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { message: "Error while signing out" },
            { status: 500 }
        );
    }
}