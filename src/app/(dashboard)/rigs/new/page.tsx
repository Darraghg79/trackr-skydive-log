import { RigForm } from "@/components/forms/RigForm"


export default function NewRigPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Rig</h1>
        <p className="text-muted-foreground">
          Create a rig setup by assigning gear components
        </p>
      </div>
      <RigForm />
    </div>
  )
}
