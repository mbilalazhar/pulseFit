import Image from "next/image";
import loginArt from "@/assets/login.png";

export default function ImageSection() {
  return (
    <div className="relative hidden overflow-hidden bg-linear-to-br from-accent/8 via-main/60 to-accent/16 lg:flex lg:items-center lg:justify-center">
      {/* Background Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 h-112 w-md rounded-full bg-accent/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-112 w-md rounded-full bg-accent/8 blur-3xl"
      />

      {/* Main Content */}
      <div className="relative flex h-full w-full flex-col items-center justify-center px-10 py-10">
        {/* Hero Illustration */}
        <Image
          src={loginArt}
          alt="A PulseFit member surrounded by their training, recovery and progress stats"
          priority
          placeholder="blur"
          sizes="50vw"
          className="min-h-0 w-full max-w-2xl flex-1 object-contain"
        />

        {/* Bottom Content */}
        <div className="mt-6 max-w-lg shrink-0 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Train Smarter with AI
          </h2>

          <p className="mt-3 text-muted-foreground">
            Personalized workouts, nutrition guidance, progress tracking, and
            AI-powered insights—all in one fitness platform built to help you
            reach your goals faster.
          </p>

          {/* Stats */}
          <div className="mt-6 flex items-center justify-center gap-12">
            <div>
              <h3 className="text-2xl font-bold text-accent">10K+</h3>
              <p className="text-sm text-muted-foreground">
                Active Members
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-accent">500K+</h3>
              <p className="text-sm text-muted-foreground">
                Workouts Logged
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-accent">98%</h3>
              <p className="text-sm text-muted-foreground">
                Success Rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}