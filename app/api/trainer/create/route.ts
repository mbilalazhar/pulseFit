import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createTrainerSchema } from "@/lib/validators/trainer";
import { weeklyWorkHours } from "@/lib/trainer-availability";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if(!session || session.role !== "ADMIN"){
            return NextResponse.json({message: "Not Authenticated"}, {status: 401});
        }
        const body = await req.json().catch(() => null);
        const parsed = createTrainerSchema.safeParse(body);
        if(!parsed.success){
            return NextResponse.json({message: "Invalid Data", error: parsed.error.flatten().fieldErrors}, {status: 400})
        }
        const data = parsed.data;

        /* Staff carry a payroll + schedule; contractors carry what the gym
           charges them. Only the matching half of the model is written. */
        const compensation = data.trainerType === "STAFF"
            ? {
                monthlySalaryMinor: Math.round(data.monthlySalary * 100),
                workHoursPerDay: weeklyWorkHours(data.availability) / data.availability.length,
                workDaysPerWeek: data.availability.length,
                availability: { create: data.availability },
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
                certifications:       [],
                contractorPaymentType: data.paymentType,
                fixedFeeAmount:        data.paymentType === "FIXED_FEE"     ? Math.round(data.amount * 100) : null,
                sessionRate:           data.paymentType === "SESSION_BASED" ? Math.round(data.amount * 100) : null,
                sessionsPerWeek:       data.sessions.length,
                availability:          { create: data.sessions },
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
        if(error && typeof error === "object" && "code" in error){
            if (error.code === "P2002") {
                return NextResponse.json(
                    {message: "A trainer with this email or specialization already exists. Check the details and try again."},
                    {status: 409}
                )
            }
            if (error.code === "P2003") {
                return NextResponse.json(
                    {message: "The selected gym is no longer available"},
                    {status: 409}
                )
            }
        }
    console.error("Error in Creating Trainer", error);
    return NextResponse.json({message: "Error in creating trainer"},{status: 500})
    }
}
