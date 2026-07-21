export type Tier = "BASIC" | "PRO" | "PREMIUM"
export type Role = "ADMIN" | "TRAINER" | "MEMBER"
export type SignupPayload = {
  organizationName: string
  email: string
  password: string
  tier: Tier
}
export type SignupResponse = {
  message: string
  gym: {
    id: string
    organizationName: string
    slug: string
  }
  user: {
    id: string
    email: string
  }
}
export type LoginPayload = {
  email: string
  password: string
}
export type LoginResponse = {
  message: string
  user: {
    id: string
    email: string
    role: Role
  }
}
export type LogoutResponse = {
  message: string
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? "Something went wrong. Please try again.")
  }

  return data as T
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return parseResponse<SignupResponse>(response)
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return parseResponse<LoginResponse>(response)
}
export async function logout(): Promise<LogoutResponse>{
  const response = await fetch("/api/logout" , {method: "POST"})
  return parseResponse<LogoutResponse>(response)
}