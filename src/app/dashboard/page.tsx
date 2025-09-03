import { prisma } from '@/lib/prisma'

export default async function Dashboard() {
  const bookings = await prisma.booking.findMany({ include: { court: true, user: true }, orderBy: { startTime: 'desc' }, take: 50 })
  const courts = await prisma.court.findMany({ orderBy: { name: 'asc' } })
  const users = await prisma.user.count()
  const confirmed = bookings.filter(b=>b.status==='CONFIRMED').length
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Courts" value={courts.length} />
        <Stat label="Users" value={users} />
        <Stat label="Bookings (50 latest)" value={bookings.length} />
        <Stat label="Confirmed" value={confirmed} />
      </div>
      <h2 className="text-xl font-semibold">Recent Bookings</h2>
      <div className="border divide-y">
        {bookings.map(b=>(
          <div key={b.id} className="p-2 text-sm flex justify-between">
            <div>{new Date(b.startTime).toLocaleString()} - {b.court.name}</div>
            <div>{b.user?.email || b.user?.phone} • {b.status} • {b.paymentStatus}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border bg-white p-3 rounded">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
