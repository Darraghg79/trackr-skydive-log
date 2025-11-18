import { UserAircraftForm } from "@/components/forms/UserAircraftForm"


export default function NewAircraftPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Aircraft</h1>
        <p className="text-muted-foreground">
          Add an aircraft type to your logbook
        </p>
      </div>
      <UserAircraftForm />
    </div>
  )
}
