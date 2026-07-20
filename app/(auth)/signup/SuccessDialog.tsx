"use client"

import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function SuccessDialog({
  open,
  organizationName,
  onDismiss,
}: {
  open: boolean
  organizationName?: string
  /** Called for OK, the close button and Escape — all lead to sign in. */
  onDismiss: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="size-6 text-success" />
          </div>
          <DialogTitle className="text-2xl">
            {organizationName ? `${organizationName} is registered` : "Your gym is registered"}
          </DialogTitle>
          <DialogDescription>
            Your purchase details have been sent to your email. You can now sign
            in to start setting up your gym.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" onClick={onDismiss}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
