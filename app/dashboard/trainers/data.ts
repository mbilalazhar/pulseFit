export type TrainerStatus = "Active" | "On Leave" | "Applied Leave"

export interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  status: TrainerStatus
  statusNote: string
  membersCount: number
  workloadPercent: number
  workloadLabel: "Light" | "Moderate" | "Heavy" | "Overloaded"
  workingHours: string
  workHoursPerDay: string
  salary: string
  salaryNote: string
  packagesCount: number
}

export const trainersData: Trainer[] = [
  {
    id: "1",
    name: "Ahmad Raza",
    email: "ahmad.raza@qualixsolutions.com",
    phone: "+92 310 1234567",
    status: "Active",
    statusNote: "On duty",
    membersCount: 28,
    workloadPercent: 82,
    workloadLabel: "Heavy",
    workingHours: "6:00 AM - 2:00 PM",
    workHoursPerDay: "8h / day",
    salary: "PKR 85,000",
    salaryNote: "Paid on 1 May",
    packagesCount: 3,
  },
  {
    id: "2",
    name: "Sara Farooq",
    email: "sara.farooq@qualixsolutions.com",
    phone: "+92 321 9876543",
    status: "On Leave",
    statusNote: "Till 18 May 2025",
    membersCount: 22,
    workloadPercent: 42,
    workloadLabel: "Light",
    workingHours: "10:00 AM - 6:00 PM",
    workHoursPerDay: "8h / day",
    salary: "PKR 75,000",
    salaryNote: "Paid on 1 May",
    packagesCount: 2,
  },
  {
    id: "3",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@qualixsolutions.com",
    phone: "+92 300 1234567",
    status: "Applied Leave",
    statusNote: "12 - 14 May 2025",
    membersCount: 31,
    workloadPercent: 92,
    workloadLabel: "Overloaded",
    workingHours: "7:00 AM - 3:00 PM",
    workHoursPerDay: "8h / day",
    salary: "PKR 90,000",
    salaryNote: "Due on 1 Jun",
    packagesCount: 4,
  },
  {
    id: "4",
    name: "Usman Khalid",
    email: "usman.khalid@qualixsolutions.com",
    phone: "+92 312 2223344",
    status: "Active",
    statusNote: "On duty",
    membersCount: 19,
    workloadPercent: 55,
    workloadLabel: "Moderate",
    workingHours: "12:00 PM - 8:00 PM",
    workHoursPerDay: "8h / day",
    salary: "PKR 70,000",
    salaryNote: "Paid on 1 May",
    packagesCount: 2,
  },
  {
    id: "5",
    name: "Maham Iqbal",
    email: "maham.iqbal@qualixsolutions.com",
    phone: "+92 333 5556666",
    status: "Active",
    statusNote: "On duty",
    membersCount: 16,
    workloadPercent: 35,
    workloadLabel: "Light",
    workingHours: "6:00 AM - 2:00 PM",
    workHoursPerDay: "8h / day",
    salary: "PKR 65,000",
    salaryNote: "Paid on 1 May",
    packagesCount: 3,
  },
  {
    id: "6",
    name: "Ali Hassan",
    email: "ali.hassan@qualixsolutions.com",
    phone: "+92 311 4447788",
    status: "Active",
    statusNote: "On duty",
    membersCount: 25,
    workloadPercent: 70,
    workloadLabel: "Heavy",
    workingHours: "3:00 PM - 11:00 PM",
    workHoursPerDay: "8h / day",
    salary: "PKR 80,000",
    salaryNote: "Paid on 1 May",
    packagesCount: 2,
  },
]

export const getTrainerStats = () => {
  const totalTrainers = trainersData.length
  const activeTrainers = trainersData.filter((t) => t.status === "Active").length
  const onLeaveTrainers = trainersData.filter((t) => t.status === "On Leave").length
  const appliedLeaveTrainers = trainersData.filter((t) => t.status === "Applied Leave").length
  const totalMembers = trainersData.reduce((sum, t) => sum + t.membersCount, 0)

  return {
    totalTrainers,
    activeTrainers,
    activePercent: ((activeTrainers / totalTrainers) * 100).toFixed(1),
    onLeaveTrainers,
    onLeavePercent: ((onLeaveTrainers / totalTrainers) * 100).toFixed(1),
    appliedLeaveTrainers,
    appliedLeavePercent: ((appliedLeaveTrainers / totalTrainers) * 100).toFixed(1),
    totalMembers,
  }
}
