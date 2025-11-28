import { redirect } from "next/navigation"

export default function RootPage() {
  // Redirect to login - middleware will handle authenticated users
  redirect("/login")
}