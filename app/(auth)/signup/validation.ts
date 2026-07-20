const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8

export const STRENGTH_LEVELS = [
  { label: "Weak Password", className: "text-destructive" },
  { label: "Fair Password", className: "text-warning" },
  { label: "Good Password", className: "text-foreground" },
  { label: "Strong Password", className: "text-success" },
]

/**
 * Strength is the count of distinct character types present: lowercase,
 * uppercase, digits and symbols. All four is the strongest password.
 * Length is enforced separately by the minimum-length rule.
 */
export function getPasswordStrength(password: string) {
  const types = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/]
  const used = types.filter((type) => type.test(password)).length

  return STRENGTH_LEVELS[Math.max(used - 1, 0)]
}

export type SignupValues = {
  organizationName: string
  email: string
  password: string
  confirmPassword: string
}

export type Errors = Partial<Record<keyof SignupValues, string>>

export function validate(values: SignupValues): Errors {
  const errors: Errors = {}

  if (!values.organizationName.trim()) {
    errors.organizationName = "Enter your organization name."
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email address."
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address."
  }

  if (!values.password) {
    errors.password = "Choose a password."
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Re-enter your password."
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match."
  }

  return errors
}
