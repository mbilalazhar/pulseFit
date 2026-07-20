// import { NextResponse } from "next/server";
// import { prisma } from "../../../lib/prisma";
// import bcrypt from "bcrypt";
// export async function POST(req:Request) {
//     try{
//     const body = await req.json();
//     console.log(body);
//     const { fullName, email, password } = body;
//     if (!fullName || !email || !password) {
//         return NextResponse.json(
//             {
//                 message:"All fields are required"
//             },
//             {
//                 status:400
//             }
//         );
//     }
//     const existingUser = await prisma.user.findUnique({
//         where:{
//             email
//         }
//     });
//     if(existingUser){

//         return NextResponse.json(
//             {
//                 message:"Email already exists"
//             },
//             {
//                 status:409
//             }
//         );
    
//     }
//     const hashedPassword = await bcrypt.hash(password,10);
//     const user = await prisma.user.create({
//         data:{
//             fullName,
//             email,
//             password:hashedPassword
//         }
//     });
//     return NextResponse.json(
//         {
//             message:"User created successfully",
    
//             user:{
//                 id:user.id,
//                 fullName:user.fullName,
//                 email:user.email
//             }
//         },
//         {
//             status:201
//         }
//     );
//     }
//     catch(error){
//         return NextResponse.json(
//             {
//                 message:"Internal Server Error"
//             },
//             {
//                 status:500
//             }
//         );
//     }
// }

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { Tier, Role, SubscriptionStatus } from "@/lib/generated/prisma/enums";

const PLANS = {
  BASIC:   { memberLimit: 500,  price: 500000 },
  PRO:     { memberLimit: 1500, price: 1200000 },
  PREMIUM: { memberLimit: 5000, price: 2500000 },
} as const;

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { organizationName, email, password, tier } = body;

    // 1. required fields
    if (!organizationName || !email || !password || !tier) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 2. validate the plan the browser sent
    if (!(tier in PLANS)) {
      return NextResponse.json(
        { message: "Invalid plan selected" },
        { status: 400 }
      );
    }
    const plan = PLANS[tier as keyof typeof PLANS];

    // 3. basic email + password checks
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4. check for existing email and organization name
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    const existingGym = await prisma.gym.findUnique({
      where: { organizationName },
    });
    if (existingGym) {
      return NextResponse.json(
        { message: "Organization name already taken" },
        { status: 409 }
      );
    }

    // 5. hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. build subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    // 7. create Gym + User + Subscription together
    const result = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({
        data: {
          organizationName,
          slug: slugify(organizationName),
        },
      });

      const user = await tx.user.create({
        data: {
          gymId: gym.id,
          email: normalizedEmail,
          password: hashedPassword,
          role: Role.ADMIN,
        },
      });

      const subscription = await tx.gymSubscription.create({
        data: {
          gymId: gym.id,
          tier: tier as Tier,
          memberLimit: plan.memberLimit,
          price: plan.price,
          status: SubscriptionStatus.TRIAL,
          startDate,
          endDate,
        },
      });

      return { gym, user, subscription };
    });

    return NextResponse.json(
      {
        message: "Organization created successfully",
        gym: {
          id: result.gym.id,
          organizationName: result.gym.organizationName,
          slug: result.gym.slug,
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        subscription: {
          tier: result.subscription.tier,
          memberLimit: result.subscription.memberLimit,
          endDate: result.subscription.endDate,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // unique constraint race condition
    if ((error as any)?.code === "P2002") {
      return NextResponse.json(
        { message: "Email or organization name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}