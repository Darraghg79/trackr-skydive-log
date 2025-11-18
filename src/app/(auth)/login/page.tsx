export const dynamic = 'force-dynamic'
import { LoginForm } from "@/components/auth/LoginForm"


export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">
        Sign in to your account
      </h2>
      <LoginForm />
    </div>
  )
}
