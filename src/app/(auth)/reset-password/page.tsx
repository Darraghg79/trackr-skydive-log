export const dynamic = 'force-dynamic'
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"


export default function ResetPasswordPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">
        Set new password
      </h2>
      <ResetPasswordForm />
    </div>
  )
}
