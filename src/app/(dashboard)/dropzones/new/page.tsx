import { DropzoneForm } from "@/components/forms/DropzoneForm"


export default function NewDropzonePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Dropzone</h1>
      <DropzoneForm />
    </div>
  )
}
