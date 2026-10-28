import Image from "next/image"
import loginArt from "@/assets/login.png"

export default function ImageSection() {
  return (
    <div className="relative hidden min-w-0 overflow-hidden bg-white/25 lg:flex lg:items-center lg:justify-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-56 -top-52 h-[32rem] w-[30rem] -rotate-25 rounded-full border-[76px] border-login-decoration-ring/70"
      />
      <div className="relative isolate flex w-full flex-col items-center px-6 py-5 xl:px-10">
        <div className="relative isolate flex w-full justify-center overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-3 -z-10 aspect-square w-[75%] max-w-[380px] -translate-x-1/2 rounded-full bg-login-decoration-disc/75"
          />
          <Image
            src={loginArt}
            alt="PulseFit trainers surrounded by fitness, scheduling and progress dashboards"
            priority
            placeholder="blur"
            sizes="(min-width: 1280px) 45vw, 50vw"
            className="relative h-[min(68svh,680px)] min-h-[360px] w-full object-contain"
          />
        </div>

        <div className="relative z-10 mt-1 w-full max-w-[560px] text-center">
          <h2 className="font-heading text-[28px] font-bold leading-tight tracking-tight xl:text-[36px]">
            Train Smarter <span className="text-login-primary">with AI</span>
          </h2>
          <p className="mx-auto mt-1.5 max-w-[520px] text-xs leading-relaxed text-login-muted xl:text-sm">
            Personalized workouts, nutrition guidance, progress tracking, and
            AI-powered insights—all in one fitness platform built to help you
            reach your goals faster.
          </p>

          <div className="mx-auto mt-4 grid max-w-[480px] grid-cols-3 divide-x divide-login-divider">
            {[
              { value: "10K+", label: "Active Members" },
              { value: "500K+", label: "Workouts Logged" },
              { value: "98%", label: "Success Rate" },
            ].map(({ value, label }) => (
              <div key={label} className="px-3">
                <p className="text-xl font-bold leading-tight text-login-stat xl:text-2xl">
                  {value}
                </p>
                <p className="mt-1 text-xs text-login-muted xl:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
