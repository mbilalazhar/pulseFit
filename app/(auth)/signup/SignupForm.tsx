"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { Loader2Icon, Building2, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signup, type Tier } from "@/lib/services/auth.services"
import { ConfirmDialog } from "./ConfirmDialog"
import { PasswordField, TextField } from "./FormFields"
import { PlanSelector, UserLimitSelector } from "./OptionCards"
import { PLANS } from "./plans"
import { SuccessDialog } from "./SuccessDialog"
import {
  getPasswordStrength,
  validate,
  MIN_PASSWORD_LENGTH,
  type Errors,
  type SignupValues,
} from "./validation"

const EMPTY_VALUES: SignupValues = {
  organizationName: "",
  email: "",
  password: "",
  confirmPassword: "",
}

export function SignupForm() {
  const router = useRouter()
  const [values, setValues] = useState<SignupValues>(EMPTY_VALUES)
  const [plan, setPlan] = useState<Tier>("BASIC")
  const [maxUsers, setMaxUsers] = useState(200)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const selectedPlan = PLANS.find((entry) => entry.value === plan)
  const strength = getPasswordStrength(values.password)

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      setConfirmOpen(false)
      setSuccessOpen(true)
    },
    onError: (error: Error) => {
      // Close the dialog so the user can correct the form.
      setConfirmOpen(false)
      alert(error.message)
    },
  })

  // Surface the length rule as soon as the user types, rather than waiting for
  // a submit — the strength label alone doesn't explain what's missing.
  const passwordMessage =
    errors.password ??
    (values.password && values.password.length < MIN_PASSWORD_LENGTH
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : undefined)

  // Once a submit has failed, re-check on every keystroke so errors clear as
  // soon as the user fixes them.
  function setField(field: keyof SignupValues, value: string) {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) setErrors(validate(next))
  }

  // Submitting only validates — the request is sent once the user confirms in
  // the review dialog.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    // Consent is re-asked every time, so an earlier tick can't carry over.
    setAgreed(false)
    setConfirmOpen(true)
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="w-full">
        <div className="space-y-4">
          <TextField
            id="organizationName"
            label="Organization Name"
            placeholder="Enter Organization Name"
            autoComplete="organization"
            icon={Building2}
            value={values.organizationName}
            onChange={(value) => setField("organizationName", value)}
            error={errors.organizationName}
            hint="Must be unique"
          />

          <TextField
            id="email"
            type="email"
            label="User Email"
            placeholder="Enter Your Email"
            autoComplete="email"
            icon={Mail}
            value={values.email}
            onChange={(value) => setField("email", value)}
            error={errors.email}
            hint="Must be unique"
          />

          <PasswordField
            id="password"
            label="Password"
            placeholder="Enter Password"
            icon={Lock}
            value={values.password}
            onChange={(value) => setField("password", value)}
            error={passwordMessage}
            labelAside={
              values.password ? (
                <span className={`text-xs font-medium ${strength.className}`}>
                  {strength.label}
                </span>
              ) : null
            }
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm Password"
            icon={Lock}
            value={values.confirmPassword}
            onChange={(value) => setField("confirmPassword", value)}
            error={errors.confirmPassword}
          />
        </div>

        <PlanSelector value={plan} onChange={setPlan} />
        <UserLimitSelector value={maxUsers} onChange={setMaxUsers} />

        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="mt-7 h-11 w-full rounded-xl bg-accent text-sm text-accent-foreground hover:bg-accent-hover"
        >
          {mutation.isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              Creating organization
            </>
          ) : (
            "Create Organization"
          )}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        planLabel={selectedPlan?.label}
        agreed={agreed}
        onAgreedChange={setAgreed}
        pending={mutation.isPending}
        onConfirm={() =>
          mutation.mutate({
            organizationName: values.organizationName,
            email: values.email,
            password: values.password,
            tier: plan,
          })
        }
      />

      <SuccessDialog
        open={successOpen}
        organizationName={mutation.data?.gym.organizationName}
        onDismiss={() => router.push("/login")}
      />
    </>
  )
}
