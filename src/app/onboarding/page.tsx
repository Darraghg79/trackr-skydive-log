import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-8 px-4">
      <OnboardingWizard />
    </div>
  )
}
