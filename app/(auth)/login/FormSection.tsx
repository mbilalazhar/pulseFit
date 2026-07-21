import Image from "next/image"
import Link from "next/link"
import loginArt from "@/assets/login.png"
import logo from "@/assets/logo.svg"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoginForm } from "./LoginForm"

const STATS = [
  { value: "10K+", label: "Users" },
  { value: "5K+", label: "Workouts" },
  { value: "98%", label: "Satisfied" },
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.21 7.21 0 0 1 0-4.56v-3.1H1.28a12.01 12.01 0 0 0 0 10.76l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1C6.22 6.88 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z"
      />
    </svg>
  )
}

export default function FormSection() {
  return (
    <div className="flex min-h-0 flex-col px-6 py-8 lg:px-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="PulseFit home">
            <Image src={logo} alt="PulseFit" priority className="h-6 w-auto" />
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium underline underline-offset-4 transition-colors hover:text-accent"
          >
            Create an account
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-2">
          <div className="w-full max-w-sm">
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-3xl tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your PulseFit account details.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full gap-2.5 bg-white text-sm [&_svg:not([class*='size-'])]:size-[18px]"
              >
                <GoogleIcon />
                Log in with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full gap-2.5 bg-white text-sm [&_svg:not([class*='size-'])]:size-[18px]"
              >
                <FacebookIcon />
                Log in with Facebook
              </Button>
            </div>

            <div className="my-7 flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs font-medium tracking-widest text-muted-foreground">
                OR
              </span>
              <Separator className="flex-1" />
            </div>

            {/* Interactive part lives in the client component */}
            <LoginForm />
          </div>
        </div>

        <footer className="text-center">
          <Link
            href="/support"
            className="text-sm font-medium underline underline-offset-4 transition-colors hover:text-accent"
          >
            Trouble signing in?
          </Link>
      </footer>
    </div>
  )
}