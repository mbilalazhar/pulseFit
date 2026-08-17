import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  let gymName: string | null = null
  if (session) {
    const gym = await prisma.gym.findUnique({
      where: { id: session.gymId },
      select: { organizationName: true },
    })
    gymName = gym?.organizationName ?? null
  }

  const title = gymName ? `${gymName.toUpperCase()}` : "Dashboard"

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar title={title} />
        <main className="scrollbar-hide flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
