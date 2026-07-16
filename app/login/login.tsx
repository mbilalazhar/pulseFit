"use client"

import { useState, type SubmitEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2Icon, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation";
import loginArt from "@/assets/login.png"
import logo from "@/assets/logo.svg"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

const STATS = [
  { value: "10K+", label: "Users" },
  { value: "5K+", label: "Workouts" },
  { value: "98%", label: "Satisfied" },
]

type Errors = {
  email?: string
  password?: string
}

function validate(email: string, password: string): Errors {
  const errors: Errors = {}

  if (!email.trim()) {
    errors.email = "Enter your email address."
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address."
  }

  if (!password) {
    errors.password = "Enter your password."
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  return errors
}

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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  // Once a submit has failed, re-check on every keystroke so errors clear as
  // soon as the user fixes them.
  function revalidate(nextEmail: string, nextPassword: string) {
    if (submitted) setErrors(validate(nextEmail, nextPassword))
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const nextErrors = validate(email, password)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setPending(true);

try {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message);
    return;
  }

    console.log(data);
    router.push("/dashboard");
} finally {
  setPending(false);
}
  }

  return (
    <main className="grid min-h-svh w-full lg:grid-cols-2">
      <div className="flex flex-col bg-linear-to-b from-white to-main/50 px-6 py-8 lg:px-12">
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

        <div className="flex flex-1 items-center justify-center py-12">
          <form noValidate onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-3xl tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your PulseFit account details.
              </p>
            </div>

            <div className="mt-8 space-y-3">
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

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      revalidate(event.target.value, password)
                    }}
                    className="h-11 rounded-xl bg-white pl-10 pr-3.5"
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    onChange={(event) => {
                      setPassword(event.target.value)
                      revalidate(email, event.target.value)
                    }}
                    className="h-11 rounded-xl bg-white pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-xs text-destructive">
                    {errors.password}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal"
              >
                <Checkbox id="remember" name="remember" />
                Keep me signed in
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Forgot password
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="mt-7 h-11 w-full rounded-xl text-sm"
            >
              {pending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Signing in
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
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

      <div className="relative hidden flex-col items-center justify-center gap-1 overflow-hidden bg-linear-to-br from-accent/8 via-main/60 to-accent/16 px-4 py-4 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-112 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 size-112 rounded-full bg-accent/8 blur-3xl"
        />

        <div className="relative flex w-full flex-1 items-center justify-center">
          <Image
            src={loginArt}
            alt="A PulseFit member surrounded by their training, recovery and progress stats"
            placeholder="blur"
            priority
            sizes="50vw"
            className="max-h-[86svh] w-full max-w-2xl object-contain"
          />
        </div>

        <div className="relative w-full max-w-md text-center">
          <h2 className="font-heading text-3xl tracking-tight">
            Transform Your Fitness Journey
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Track workouts, monitor progress, and achieve your goals with
            PulseFit
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <dt className="font-heading text-2xl tracking-tight text-accent">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </main>
  )
}