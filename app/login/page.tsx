import type { Metadata } from "next"

import LoginPage from "./login"

export const metadata: Metadata = {
  title: "Sign in · PulseFit",
  description: "Sign in to your PulseFit account.",
}

export default function Page() {
  return <LoginPage />
}
