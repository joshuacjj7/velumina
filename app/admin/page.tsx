import { auth, } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth()

  return (
    <main className="p-8">
      <h1 className="text-2xl text-gray-600 font-semibold">Admin Dashboard</h1>
      <p className="text-neutral-500 mt-1">Welcome, {session?.user?.name}</p>
    </main>
  )
}
