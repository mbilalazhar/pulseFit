CREATE TYPE "ExpenseStatus" AS ENUM ('PAID', 'PENDING');

CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "date" DATE NOT NULL,
    "status" "ExpenseStatus" NOT NULL,
    "method" TEXT NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Expense_amount_check" CHECK ("amountMinor" > 0),
    CONSTRAINT "Expense_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Expense_gymId_date_idx" ON "Expense"("gymId", "date");
CREATE INDEX "Expense_gymId_status_idx" ON "Expense"("gymId", "status");
