import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPlanSchema } from "@/lib/validators/plan";

export async function POST(req:Request) {
    try {
        const session = await getSession();
        if(!session || session.role !== "ADMIN"){ 
            return NextResponse.json({message: "Not Authenticated"}, {status: 401});
        }
        const body = await req.json();
        const parsed = createPlanSchema.safeParse(body);
        if(!parsed.success){
            return NextResponse.json({message: "Invalid Data", error: parsed.error.flatten().fieldErrors}, {status: 400})
        }
        const data = parsed.data;
        const plan = await prisma.plan.create({
            data: {
                gymId:          session.gymId,
                name:           data.name,
                shortDesc:      data.shortDesc,
                longDesc:       data.longDesc,
                basePriceMinor: data.basePriceMinor,
                currency:       data.currency,
                status:         data.status,
                features:       {create: data.features},
                durations:      {create: data.durations},
            },
            include: {features: true, durations: true},
        });
        return NextResponse.json({message: "Plan Created", plan}, {status : 201})
    } catch (error: unknown) {
        if(error && typeof error === "object" && "code" in error && error.code === "P2002"){
        return NextResponse.json(
            {message: "A Plan with this name already exists!"},
            {status: 409}
        )
    }        
    console.error("Error in Creating Plan", error);
    return NextResponse.json({message: "Error in creating plan"},{status: 500})
    }
}