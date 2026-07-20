import Image from "next/image"
import Link from "next/link"
import logo from "@/assets/logo.svg"
import { SignupForm } from "./SignupForm"

export default function FormSection() {
  return (
    <div className="flex min-h-0 flex-col justify-center p-6 lg:py-4 lg:pl-0 lg:pr-10 xl:pr-14">
      <div className="flex min-h-0 w-full flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none rounded-2xl border border-border bg-card p-4 shadow-sm xl:p-10">
        {/* Logo only shows here on small screens, where ImageSection is hidden */}
        <Link href="/" aria-label="PulseFit home" className="mb-6 lg:hidden">
          <Image src={logo} alt="PulseFit" priority className="h-7 w-auto" />
        </Link>

        <div className="mt-6">
          {/* Interactive part lives in the client component */}
          <SignupForm />
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
