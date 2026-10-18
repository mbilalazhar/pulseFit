export const SCHEDULE_DAYS = [
  { short: "Mon", name: "Monday", date: "19 Oct" },
  { short: "Tue", name: "Tuesday", date: "20 Oct" },
  { short: "Wed", name: "Wednesday", date: "21 Oct" },
  { short: "Thu", name: "Thursday", date: "22 Oct" },
  { short: "Fri", name: "Friday", date: "23 Oct" },
  { short: "Sat", name: "Saturday", date: "24 Oct" },
  { short: "Sun", name: "Sunday", date: "25 Oct" },
] as const
export const SESSION_TIMES = [16 * 60, 17 * 60, 18 * 60, 19 * 60]
export const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]

export type PreviewSession = {
  id: string
  day: number
  start: number
  memberId: string
  member: string
  focus: string
}

export const SAMPLE_SESSIONS: PreviewSession[] = [
  { id: "mon-1", day: 0, start: 960, memberId: "ali", member: "Ali Raza", focus: "Strength & conditioning" },
  { id: "mon-2", day: 0, start: 1020, memberId: "sarah", member: "Sarah Khan", focus: "Mobility & core" },
  { id: "mon-3", day: 0, start: 1140, memberId: "hamza", member: "Hamza Ali", focus: "Functional training" },
  { id: "tue-1", day: 1, start: 960, memberId: "ayesha", member: "Ayesha Noor", focus: "Strength & conditioning" },
  { id: "tue-2", day: 1, start: 1080, memberId: "zain", member: "Zain Malik", focus: "Weight training" },
  { id: "wed-1", day: 2, start: 960, memberId: "sarah", member: "Sarah Khan", focus: "Mobility & core" },
  { id: "wed-2", day: 2, start: 1020, memberId: "ali", member: "Ali Raza", focus: "Strength & conditioning" },
  { id: "wed-3", day: 2, start: 1140, memberId: "hira", member: "Hira Ahmed", focus: "Cardio & endurance" },
  { id: "thu-1", day: 3, start: 1020, memberId: "usman", member: "Usman Tariq", focus: "Functional training" },
  { id: "thu-2", day: 3, start: 1080, memberId: "fatima", member: "Fatima Saeed", focus: "Mobility & core" },
  { id: "fri-1", day: 4, start: 960, memberId: "hamza", member: "Hamza Ali", focus: "Functional training" },
  { id: "fri-2", day: 4, start: 1080, memberId: "ayesha", member: "Ayesha Noor", focus: "Strength & conditioning" },
]

export function sessionTime(minutes: number) {
  const hour = Math.floor(minutes / 60)
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
}

/** Exchange the member and their training focus; the two one-hour slots stay fixed. */
export function swapSessionMembers(sessions: PreviewSession[], sourceId: string, targetId: string): PreviewSession[] {
  const source = sessions.find((session) => session.id === sourceId)
  const target = sessions.find((session) => session.id === targetId)
  if (!source || !target || source.id === target.id || source.memberId === target.memberId) throw new Error("Choose a session with a different member.")
  return sessions.map((session) => {
    const replacement = session.id === source.id ? target : session.id === target.id ? source : null
    return replacement ? { ...session, memberId: replacement.memberId, member: replacement.member, focus: replacement.focus } : session
  })
}

export function moveSession(sessions: PreviewSession[], id: string, day: number, start: number, workingDays: number[]): PreviewSession[] {
  if (!sessions.some((session) => session.id === id)) throw new Error("This session is no longer available.")
  if (!workingDays.includes(day)) throw new Error("Choose a working day for this session.")
  if (!SESSION_TIMES.includes(start)) throw new Error("Choose a time between 4:00 PM and 8:00 PM.")
  if (sessions.some((session) => session.id !== id && session.day === day && session.start === start)) throw new Error("That slot is already booked. Choose a free time or swap the two sessions.")
  return sessions.map((session) => session.id === id ? { ...session, day, start } : session)
}
