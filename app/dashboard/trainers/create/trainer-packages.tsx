"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  useTrainerForm,
  inputClass,
  formatPkr,
  PACKAGE_TYPES,
  TRAINING_DURATIONS,
  PACKAGE_TYPE_BADGE,
  type PackageType,
  type PackageDuration,
} from "./trainer-form-context"
import { StepHeading, FieldLabel, SelectField } from "./form-fields"

export function TrainerPackages() {
  const {
    packages,
    pkgName,
    setPkgName,
    pkgType,
    setPkgType,
    pkgDuration,
    setPkgDuration,
    pkgPrice,
    setPkgPrice,
    addPackage,
    removePackage,
  } = useTrainerForm()

  const isConsultation = pkgType === "Consultation"

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div className="space-y-1">
        <StepHeading step={3} title="Trainer Packages" />
        <p className="text-sm text-muted-foreground">
          Create training or consultation packages that members can book with this trainer.
        </p>
      </div>

      {/* Add-package row */}
      <div className="grid items-end gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <FieldLabel htmlFor="pkg-name">Package Name</FieldLabel>
          <Input
            id="pkg-name"
            value={pkgName}
            onChange={(e) => setPkgName(e.target.value)}
            placeholder="e.g. 1-on-1 Training"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="pkg-type">Type</FieldLabel>
          <SelectField
            id="pkg-type"
            value={pkgType}
            onChange={(v) => setPkgType(v as PackageType)}
            options={PACKAGE_TYPES}
          />
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="pkg-duration">Duration</FieldLabel>
          <SelectField
            id="pkg-duration"
            value={pkgDuration}
            onChange={(v) => setPkgDuration(v as PackageDuration)}
            /* Consultations are open-ended, so the only option is "-". */
            options={isConsultation ? ["-"] : TRAINING_DURATIONS}
            disabled={isConsultation}
          />
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="pkg-price">Price (PKR)</FieldLabel>
          <div className="flex h-11 items-center rounded-sm border border-input bg-white px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
            <span className="mr-2 text-sm text-muted-foreground">PKR</span>
            <input
              id="pkg-price"
              inputMode="numeric"
              value={pkgPrice}
              onChange={(e) => setPkgPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <Button type="button" size="lg" onClick={addPackage} className="h-11 gap-1.5">
          <Plus className="size-4" />
          Add Package
        </Button>
      </div>

      {/* Added packages */}
      {packages.length === 0 ? (
        <p className="rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          No packages added yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="w-10 px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Package Name</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Duration</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">Price (PKR)</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, index) => (
                <tr key={pkg.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{pkg.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        PACKAGE_TYPE_BADGE[pkg.type],
                      )}
                    >
                      {pkg.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {pkg.duration}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {formatPkr(pkg.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removePackage(pkg.id)}
                      aria-label={`Remove ${pkg.name}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
