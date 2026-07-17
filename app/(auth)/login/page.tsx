import FormSection  from "./FormSection"
import ImageSection  from "./ImageSection"

export default function LoginPage() {
  return (
    <main className="grid min-h-svh w-full lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      <FormSection />
      <ImageSection />
    </main>
  )
}