export const dynamic = 'force-dynamic'
import { RegisterForm } from "@/components/auth/RegisterForm"


export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">
        Create your account
      </h2>
      <RegisterForm />
    </div>
  )
}
