"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

// TODO: point this at the real support destination.
const SUPPORT_EMAIL = "support@pulsefit.com";

export default function NotFoundButtons() {
  const router = useRouter();

  return (
    <div className="flex flex-row items-center justify-center gap-3">
      <Button
        variant="outline"
        size="lg"
        onClick={() => router.back()}
        className="h-11 shrink-0 gap-2 border-border bg-background px-6 text-base text-foreground shadow-sm hover:bg-muted"
      >
        Go Back
      </Button>

      <Button
        size="lg"
        nativeButton={false}
        render={<a href={`mailto:${SUPPORT_EMAIL}`} />}
        className="h-11 shrink-0 gap-2 bg-accent px-6 text-base text-accent-foreground shadow-sm hover:bg-accent-hover focus-visible:ring-ring/40"
      >
        Contact Support
      </Button>
    </div>
  );
}
