-- CreateEnum
CREATE TYPE "TrainerType" AS ENUM ('STAFF', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "TrainerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "TrainerShift" AS ENUM ('MORNING', 'EVENING', 'NIGHT', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "ContractorPaymentType" AS ENUM ('FIXED_FEE', 'SESSION_BASED');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('TRAINING', 'CONSULTATION');

-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "trainerType" "TrainerType" NOT NULL,
    "status" "TrainerStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthlySalary" DOUBLE PRECISION,
    "workHoursPerDay" DOUBLE PRECISION,
    "workDaysPerWeek" INTEGER,
    "shift" "TrainerShift",
    "contractorPaymentType" "ContractorPaymentType",
    "fixedFeeAmount" DOUBLE PRECISION,
    "sessionRate" DOUBLE PRECISION,
    "sessionsPerWeek" INTEGER,
    "joiningDate" TIMESTAMP(3),
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "certifications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerSpecialization" (
    "trainerId" TEXT NOT NULL,
    "specializationId" TEXT NOT NULL,

    CONSTRAINT "TrainerSpecialization_pkey" PRIMARY KEY ("trainerId","specializationId")
);

-- CreateTable
CREATE TABLE "TrainingPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trainer_gymId_status_idx" ON "Trainer"("gymId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_gymId_email_key" ON "Trainer"("gymId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_name_key" ON "Specialization"("name");

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerSpecialization" ADD CONSTRAINT "TrainerSpecialization_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerSpecialization" ADD CONSTRAINT "TrainerSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "Specialization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPackage" ADD CONSTRAINT "TrainingPackage_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
