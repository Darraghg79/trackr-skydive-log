import { GearForm } from "@/components/forms/GearForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewGearPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Gear</CardTitle>
          <CardDescription>
            Add gear components to track service intervals and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GearForm />
        </CardContent>
      </Card>
    </div>
  )
}
