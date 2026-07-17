import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";
export async function POST(req:Request) {
    try{
    const body = await req.json();
    console.log(body);
    const { fullName, email, password } = body;
    if (!fullName || !email || !password) {
        return NextResponse.json(
            {
                message:"All fields are required"
            },
            {
                status:400
            }
        );
    }
    const existingUser = await prisma.user.findUnique({
        where:{
            email
        }
    });
    if(existingUser){

        return NextResponse.json(
            {
                message:"Email already exists"
            },
            {
                status:409
            }
        );
    
    }
    const hashedPassword = await bcrypt.hash(password,10);
    const user = await prisma.user.create({
        data:{
            fullName,
            email,
            password:hashedPassword
        }
    });
    return NextResponse.json(
        {
            message:"User created successfully",
    
            user:{
                id:user.id,
                fullName:user.fullName,
                email:user.email
            }
        },
        {
            status:201
        }
    );
    }
    catch(error){
        return NextResponse.json(
            {
                message:"Internal Server Error"
            },
            {
                status:500
            }
        );
    }
}