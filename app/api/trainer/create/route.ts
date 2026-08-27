import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createTrainerSchema } from "@/lib/validators/trainer";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if(!session || session.role !== "ADMIN"){
            return NextResponse.json({message: "Not Authenticated"}, {status: 401});
        }
        const body = await req.json();
        const parsed = createTrainerSchema.safeParse(body);
        if(!parsed.success){
            return NextResponse.json({message: "Invalid Data", error: parsed.error.flatten().fieldErrors}, {status: 400})
        }
        const data = parsed.data;

        /* Staff carry a payroll + schedule; contractors carry what the gym
           charges them. Only the matching half of the model is written. */
        const compensation = data.trainerType === "STAFF"
            ? {
                monthlySalary:   data.monthlySalary,
                workHoursPerDay: data.workHoursPerDay,
                workDaysPerWeek: data.workDaysPerWeek,
                shift:           data.shift,
                certifications:  data.certifications,
                specializations: {
                    create: data.specializations.map((name) => ({
                        specialization: {
                            connectOrCreate: {where: {name}, create: {name}},
                        },
                    })),
                },
            }
            : {
                contractorPaymentType: data.paymentType,
                fixedFeeAmount:        data.paymentType === "FIXED_FEE"     ? data.amount : null,
                sessionRate:           data.paymentType === "SESSION_BASED" ? data.amount : null,
                sessionsPerWeek:       data.sessionsPerWeek,
            };

        const trainer = await prisma.trainer.create({
            data: {
                gymId:         session.gymId,
                fullName:      data.fullName,
                email:         data.email,
                contactNumber: data.contactNumber,
                trainerType:   data.trainerType,
                joiningDate:   new Date(data.joiningDate),
                ...compensation,
            },
            include: {specializations: {include: {specialization: true}}},
        });
        return NextResponse.json({message: "Trainer Created", trainer}, {status: 201})
    } catch (error: unknown) {
        if(error && typeof error === "object" && "code" in error && error.code === "P2002"){
        return NextResponse.json(
            {message: "A trainer with this email already exists!"},
            {status: 409}
        )
    }
    console.error("Error in Creating Trainer", error);
    return NextResponse.json({message: "Error in creating trainer"},{status: 500})
    }
}
