import Image from "next/image";
import { Users, BarChart3, ShieldCheck, Star } from "lucide-react";
import signupArt from "@/assets/signup.png";

const FEATURES = [
  {
    icon: Users,
    title: "Centralized Management",
    description:
      "Manage members, trainers and operations from one powerful dashboard.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description:
      "AI-powered insights to track performance and grow your organization.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description: "Your data is protected with enterprise-grade security.",
  },
  {
    icon: Star,
    title: "Scalable Growth",
    description:
      "Choose a plan that fits your goals and expand without limits.",
  },
];

export default function ImageSection() {
  return (
    <div className="relative hidden flex-col overflow-hidden px-6 py-8 lg:flex xl:px-8">
      {/* Heading */}
      <div className="mt-4 shrink-0">
        <h1 className="font-heading whitespace-nowrap text-3xl font-bold tracking-tight">
          Create Your Organization
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Build a smarter fitness community with AI-powered management,
          analytics and insights.
        </p>
      </div>

      {/* Hero Illustration */}
      <div className="relative -mx-4 my-4 min-h-0 flex-1 xl:-mx-6">
        <Image
          src={signupArt}
          alt="A PulseFit gym connected to member, analytics and security dashboards"
          fill
          priority
          placeholder="blur"
          sizes="55svw"
          className="object-cover"
        />
      </div>

      {/* Feature highlights */}
      <div className="grid shrink-0 grid-cols-4 gap-6">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/10">
              <Icon className="size-6 text-accent" />
            </div>
            <h3 className="mt-3 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
