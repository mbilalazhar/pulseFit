import FormSection from "./FormSection"
import ImageSection from "./ImageSection"

export default function SignupPage() {
  return (
    <main className="grid min-h-svh w-full bg-main/30 lg:h-svh lg:grid-cols-[3fr_2fr] lg:overflow-hidden">
      <ImageSection />
      <FormSection />
    </main>
  )
}
