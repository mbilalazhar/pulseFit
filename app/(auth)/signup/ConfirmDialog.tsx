"use client"

import Link from "next/link"
import { Loader2Icon, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function ConfirmDialog({
  open,
  onOpenChange,
  planLabel,
  agreed,
  onAgreedChange,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planLabel?: string
  agreed: boolean
  onAgreedChange: (agreed: boolean) => void
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Before we continue</DialogTitle>
          <DialogDescription>
            Please make sure the details you entered are correct. You can go
            back and edit them at any time before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">You are subscribing to</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {planLabel} plan
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Confirm you want to continue with this plan.
          </p>
        </div>

        <Label
          htmlFor="privacy"
          className="cursor-pointer items-start gap-3 text-sm font-normal leading-relaxed"
        >
          <Checkbox
            id="privacy"
            checked={agreed}
            onCheckedChange={(value) => onAgreedChange(value)}
          />
          <span>
            I agree to the{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="font-medium text-accent"
            >
              Privacy Policy
            </Link>{" "}
            and Terms of Service.
          </span>
        </Label>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline" disabled={pending}>
                <ArrowLeft />
                Go back
              </Button>
            }
          />
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending || !agreed}
          >
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Creating
              </>
            ) : (
              <>
                <Check />
                Confirm plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
