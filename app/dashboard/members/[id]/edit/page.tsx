import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memberEditData, readMemberForEdit } from "@/lib/member-edit-server"
import { EditMemberForm } from "../../edit-member-form"

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  const { id } = await params
  const member = await readMemberForEdit(prisma, session.gymId, id)
  if (!member) notFound()
  const data = memberEditData(member)
  return <EditMemberForm key={data.revision} initial={data} />
}
