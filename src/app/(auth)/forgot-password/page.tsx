export const dynamic = 'force-dynamic'
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"


export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Reset password</h2>
      <ForgotPasswordForm />
    </div>
  )
}
