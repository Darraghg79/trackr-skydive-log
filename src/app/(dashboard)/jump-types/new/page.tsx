import { UserJumpTypeForm } from "@/components/forms/UserJumpTypeForm"


export default function NewJumpTypePage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Jump Type</h1>
        <p className="text-muted-foreground">
          Create a custom jump type category
        </p>
      </div>
      <UserJumpTypeForm />
    </div>
  )
}
