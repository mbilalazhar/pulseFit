import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import logo from "@/assets/logo.svg"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoginForm } from "./LoginForm"

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
    <div className="relative z-10 flex min-h-svh flex-col px-5 pb-8 pt-6 sm:px-10 lg:px-[8%] lg:pb-6 lg:pt-5">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="PulseFit home">
          <Image src={logo} alt="PulseFit" priority className="h-[22px] w-auto xl:h-7" />
        </Link>
        <Link
          href="/signup"
          className="group inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4 transition-colors hover:text-[#d41250] xl:text-sm"
        >
          Create an account
          <ArrowRight aria-hidden="true" className="size-3.5 text-[#d41250] transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center pt-10">
        <div className="w-full max-w-[400px] rounded-[22px] border border-white/80 bg-white/95 px-6 py-5 shadow-[0_18px_60px_-22px_rgba(40,28,45,0.15)] sm:px-8 lg:max-w-[368px] xl:max-w-[440px] xl:px-10 xl:py-8">
          <div className="space-y-1 text-center">
            <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight xl:text-[32px]">
              Welcome back
            </h1>
            <p className="text-xs text-[#7c7d86] xl:text-sm">
              Enter your PulseFit account details.
            </p>
          </div>

          <div className="mt-4 space-y-2 xl:mt-6 xl:space-y-2.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-9 w-full justify-start xl:h-11 gap-3 rounded-[10px] border-[#dedee5] bg-white px-3.5 text-xs font-semibold shadow-none hover:bg-[#faf7f9] xl:text-sm"
            >
              <span className="flex w-7 shrink-0 items-center border-r border-[#eeeef2] pr-3 [&>svg]:size-[18px]">
                <GoogleIcon />
              </span>
              Log in with Google
              <ArrowRight aria-hidden="true" className="ml-auto size-3.5 text-[#7c7d86]" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-9 w-full justify-start xl:h-11 gap-3 rounded-[10px] border-[#dedee5] bg-white px-3.5 text-xs font-semibold shadow-none hover:bg-[#faf7f9] xl:text-sm"
            >
              <span className="flex w-7 shrink-0 items-center border-r border-[#eeeef2] pr-3 [&>svg]:size-[18px]">
                <FacebookIcon />
              </span>
              Log in with Facebook
              <ArrowRight aria-hidden="true" className="ml-auto size-3.5 text-[#7c7d86]" />
            </Button>
          </div>

          <div className="my-3 flex xl:my-5 items-center gap-4">
            <Separator className="flex-1 bg-[#e3e3e9]" />
            <span className="text-[11px] font-medium text-[#7c7d86]">OR</span>
            <Separator className="flex-1 bg-[#e3e3e9]" />
          </div>

          <LoginForm />

          <footer className="mt-4 border-t border-[#eeeef2] pt-3 text-center leading-none xl:mt-6 xl:pt-4">
            <Link
              href="/support"
              className="group inline-flex items-center gap-2 text-xs font-medium transition-colors hover:text-[#d41250]"
            >
              Trouble signing in?
              <ArrowRight aria-hidden="true" className="size-3.5 text-[#d41250] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
