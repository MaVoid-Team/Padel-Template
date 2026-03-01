'use client'
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import CalendarAvailability from '@/components/CalendarAvailability'

export default function BookClient() {
  const { data: session, status } = useSession()
  const [courts, setCourts] = useState<any[]>([])
  const [courtId, setCourtId] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [amount, setAmount] = useState<number>(15000)
  const [method, setMethod] = useState<'CASH'|'PAYMOB'>('CASH')
  const [billing, setBilling] = useState<any>({ apartment: "NA", email: "test@example.com", floor: "NA", first_name: "Padel", street: "NA", building: "NA", phone_number: "+201000000000", shipping_method: "NA", postal_code: "NA", city: "Cairo", country: "EG", last_name: "User", state: "Cairo" })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ 
    fetch('/api/courts')
      .then(r=>r.json())
      .then(data=>{ 
        setCourts(data); 
        if (data && data[0]) setCourtId(data[0].id) 
      })
      .catch(err => {
        console.error('Failed to load courts:', err)
        setError('Failed to load courts')
      })
  },[])

  async function book() {
    setMsg('')
    setError('')

    // Validation
    if (!courtId) {
      setError('Please select a court')
      return
    }
    if (!date) {
      setError('Please select a date')
      return
    }
    if (!time) {
      setError('Please select a time')
      return
    }

    setLoading(true)

    const dt = new Date(date + 'T' + time + ':00')
    const res = await fetch('/api/bookings', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({
        courtId, startTime: dt.toISOString(), durationMins: duration, amount, paymentMethod: method
      }) 
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      setLoading(false)
      if (res.status === 401) {
        setError('Please log in to book a court')
        return
      }
      setError(data?.message || data || 'Failed to book')
      return
    }

    if (method === 'PAYMOB') {
      const r = await fetch('/api/paymob/checkout', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ bookingId: data.id, billing }) 
      })
      const p = await r.json()
      setLoading(false)
      if (p.iframeUrl) window.location.href = p.iframeUrl
      else setError('Payment init failed')
    } else {
      setLoading(false)
      setMsg('✅ Booked successfully! (Cash on arrival)')
      setDate('')
      setTime('')
    }
  }

  // Show loading state
  if (status === 'loading') {
    return <div className="p-4">Loading authentication status...</div>
  }

  // Require login
  if (!session) {
    return (
      <div className="space-y-6 max-w-md">
        <h1 className="text-xl font-semibold">Book a court</h1>
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded">
          <p className="font-semibold text-yellow-800">Login required</p>
          <p className="text-yellow-700 mt-2">You need to be logged in to book a court.</p>
        </div>
        <button 
          onClick={() => signIn(undefined, { callbackUrl: '/book' })} 
          className="border px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded w-full"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Book a court</h1>
      <p className="text-sm text-gray-600">Logged in as: {session.user?.email}</p>

      {error && (
        <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {msg && (
        <div className="p-3 border border-green-300 bg-green-50 text-green-700 rounded">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={courtId} onChange={e=>setCourtId(e.target.value)} className="border p-2 w-full rounded">
          <option value="">Select court</option>
          {courts.length === 0 ? <option disabled>Loading courts...</option> : courts.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 w-full rounded"/>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="border p-2 w-full rounded"/>
        <input type="number" value={duration} onChange={e=>setDuration(parseInt(e.target.value) || 60)} className="border p-2 w-full rounded" placeholder="Duration (mins)"/>
        <input type="number" value={amount} onChange={e=>setAmount(parseInt(e.target.value) || 15000)} className="border p-2 w-full rounded" placeholder="Amount (piastres)"/>
        <select value={method} onChange={e=>setMethod(e.target.value as any)} className="border p-2 w-full rounded">
          <option value="CASH">Cash on Arrival</option>
          <option value="PAYMOB">Paymob (Card/Wallet)</option>
        </select>
      </div>
      
      <button 
        onClick={book} 
        disabled={loading || !courts.length}
        className="border px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded w-full"
      >
        {loading ? 'Booking...' : 'Book Now'}
      </button>

      {courtId && <CalendarAvailability courtId={courtId} />}
    </div>
  )
}
