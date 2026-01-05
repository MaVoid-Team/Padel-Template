'use client'
import { useEffect, useState } from 'react'
import CalendarAvailability from '@/components/CalendarAvailability'

export default function BookClient() {
  const [courts, setCourts] = useState<any[]>([])
  const [courtId, setCourtId] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [amount, setAmount] = useState<number>(15000)
  const [method, setMethod] = useState<'CASH'|'PAYMOB'>('CASH')
  const [billing, setBilling] = useState<any>({ apartment: "NA", email: "test@example.com", floor: "NA", first_name: "Padel", street: "NA", building: "NA", phone_number: "+201000000000", shipping_method: "NA", postal_code: "NA", city: "Cairo", country: "EG", last_name: "User", state: "Cairo" })
  const [msg, setMsg] = useState('')

  useEffect(()=>{ fetch('/api/courts').then(r=>r.json()).then(data=>{ setCourts(data); if (data && data[0]) setCourtId(data[0].id) }) },[])

  async function book() {
    const dt = new Date(date + 'T' + time + ':00')
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      courtId, startTime: dt.toISOString(), durationMins: duration, amount, paymentMethod: method
    }) })
    const data = await res.json()
    if (!res.ok) return setMsg(data || 'Failed to book')

    if (method === 'PAYMOB') {
      const r = await fetch('/api/paymob/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: data.id, billing }) })
      const p = await r.json()
      if (p.iframeUrl) window.location.href = p.iframeUrl
      else setMsg('Payment init failed')
    } else {
      setMsg('Booked (Cash on arrival).')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Book a court</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={courtId} onChange={e=>setCourtId(e.target.value)} className="border p-2 w-full">
          <option value="">Select court</option>
          {courts.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 w-full"/>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="border p-2 w-full"/>
        <input type="number" value={duration} onChange={e=>setDuration(parseInt(e.target.value))} className="border p-2 w-full" placeholder="Duration (mins)"/>
        <input type="number" value={amount} onChange={e=>setAmount(parseInt(e.target.value))} className="border p-2 w-full" placeholder="Amount (piastres)"/>
        <select value={method} onChange={e=>setMethod(e.target.value as any)} className="border p-2 w-full">
          <option value="CASH">Cash on Arrival</option>
          <option value="PAYMOB">Paymob (Card/Wallet)</option>
        </select>
      </div>
      <button onClick={book} className="border px-4 py-2">Book</button>
      <div>{msg}</div>

      <CalendarAvailability courtId={courtId} />
    </div>
  )
}
