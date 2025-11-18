import { UserAircraftForm } from "@/components/forms/UserAircraftForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewAircraftPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add Aircraft</CardTitle>
          <CardDescription>
            Add an aircraft type to your logbook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAircraftForm />
        </CardContent>
      </Card>
    </div>
  )
}
