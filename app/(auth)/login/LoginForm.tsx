"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2Icon, Mail, Lock, Eye, EyeOff, OctagonAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/services/auth.services"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

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

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      toast.success("Signed in successfully. Redirecting to your dashboard...")
      router.push("/dashboard")
    },
  })

  // Once a submit has failed, re-check on every keystroke so errors clear as
  // soon as the user fixes them.
  function revalidate(nextEmail: string, nextPassword: string) {
    if (submitted) setErrors(validate(nextEmail, nextPassword))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const nextErrors = validate(email, password)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    mutation.mutate({ email, password })
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="w-full">
      {mutation.isError ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <OctagonAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{mutation.error.message}</span>
        </div>
      ) : null}

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
              aria-describedby={errors.password ? "password-error" : undefined}
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
        disabled={mutation.isPending}
        className="mt-7 h-11 w-full rounded-xl text-sm"
      >
        {mutation.isPending ? (
          <>
            <Loader2Icon className="animate-spin" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}