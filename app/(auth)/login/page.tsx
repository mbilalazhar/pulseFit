import FormSection  from "./FormSection"
import ImageSection  from "./ImageSection"

export default function LoginPage() {
  return (
    <main className="relative isolate grid min-h-svh w-full overflow-hidden bg-[#f7f7f9] text-[#161619] lg:grid-cols-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-80 -left-96 -z-10 size-[44rem] rounded-full border-[100px] border-[#f4e4eb]/65"
      />
      <FormSection />
      <ImageSection />
    </main>
  )
}
