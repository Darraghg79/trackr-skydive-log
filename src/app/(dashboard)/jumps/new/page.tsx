import { JumpForm } from "@/components/forms/JumpForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewJumpPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Log New Jump</CardTitle>
          <CardDescription>
            Record your jump details and update your logbook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JumpForm />
        </CardContent>
      </Card>
    </div>
  )
}
