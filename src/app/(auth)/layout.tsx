import { Logo } from "@/components/shared/Logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
        </div>
        <div className="bg-background rounded-lg shadow-lg p-6 border">
          {children}
        </div>
      </div>
    </div>
  )
}
