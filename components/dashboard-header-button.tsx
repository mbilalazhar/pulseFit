import type { ComponentProps } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const backgrounds = {
  transparent: "border-border bg-transparent text-foreground hover:border-foreground/40 hover:bg-transparent hover:text-foreground",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
} as const

type SharedProps = {
  icon: LucideIcon
  text: string
  /** Transparent secondary action, or theme-aware primary action (black/white). */
  bgColor: keyof typeof backgrounds
}

type ActionProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "className" | "style" | "variant" | "size" | "render" | "nativeButton" | "type"
> & {
  href?: never
}

export type DashboardHeaderButtonProps = SharedProps & (
  | { href: string; onClick?: never }
  | ActionProps
)

/**
 * Shared dashboard page-header action. Use href for navigation, onClick for
 * actions/modals, or compose with DialogTrigger's render prop.
 * Layout and typography stay here so callers cannot vary button sizing.
 * No client boundary is needed: server pages can render links with Lucide icons.
 */
export function DashboardHeaderButton({
  icon: Icon,
  text,
  bgColor,
  ...props
}: DashboardHeaderButtonProps) {
  const className = cn(
    backgrounds[bgColor],
    "h-9 self-start gap-2 rounded-lg px-4 py-2 text-xs font-medium [&_svg]:size-4",
  )
  const content = <><Icon aria-hidden="true" className="size-4" /><span>{text}</span></>

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cn(buttonVariants(), className)}>
        {content}
      </Link>
    )
  }

  return (
    <Button {...props} type="button" className={className}>
      {content}
    </Button>
  )
}
