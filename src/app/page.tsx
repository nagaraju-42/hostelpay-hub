import { redirect } from 'next/navigation'

export default function Home() {
  // Instantly route visitors away from the root URL.
  // Our middleware will catch them at /dashboard and handle the auth check!
  redirect('/dashboard')
}