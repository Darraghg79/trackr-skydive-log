export const dynamic = 'force-dynamic'
import { MagicLinkForm } from "@/components/auth/MagicLinkForm"


export default function MagicLinkPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">
        Sign in with magic link
      </h2>
      <MagicLinkForm />
    </div>
  )
}
