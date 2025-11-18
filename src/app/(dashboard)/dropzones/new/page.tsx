import { DropzoneForm } from "@/components/forms/DropzoneForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewDropzonePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Dropzone</CardTitle>
          <CardDescription>
            Add a dropzone location with rates and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DropzoneForm />
        </CardContent>
      </Card>
    </div>
  )
}
