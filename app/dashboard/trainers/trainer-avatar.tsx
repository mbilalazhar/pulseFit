import Image from "next/image"
import defaultAvatar from "@/assets/User_Default.png"
import { cn } from "@/lib/utils"

/* Falls back to the bundled default portrait until a trainer has an uploaded
   photo. Uploaded photos are remote URLs, which skip the optimizer so they
   render without a `remotePatterns` entry in next.config. */
export function TrainerAvatar({
  src,
  alt,
  size,
  className,
}: {
  src?: string | null
  alt: string
  size: number
  className?: string
}) {
  const uploaded = Boolean(src)

  return (
    <Image
      src={src || defaultAvatar}
      alt={alt}
      width={size}
      height={size}
      unoptimized={uploaded}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  )
}
