'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function HeroBooking() {
  const [courts, setCourts] = useState<any[]>([])
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null)
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/courts')
        if (res.ok) {
          const data = await res.json()
          setCourts(data)
          if (data && data.length) setSelectedCourt(data[0].id)
        } else throw new Error('fetch failed')
      } catch (e) {
        setCourts([
          { id: 'court-1', name: 'Center Court', imageQuery: 'padel court' },
          { id: 'court-2', name: 'Sunset Court', imageQuery: 'outdoor padel court' },
          { id: 'court-3', name: 'VIP Court', imageQuery: 'indoor padel court' }
        ])
        setSelectedCourt('court-1')
      }
    }
    load()
  }, [])

  function courtImageUrl(q: string) {
    return `https://source.unsplash.com/1200x800/?${encodeURIComponent(q)}`
  }

  function openBooking(courtId: string) {
    setSelectedCourt(courtId)
    setShowEmailPrompt(true)
  }

  async function confirmBooking(paymentMethod: 'CASH' | 'PAYMOB' = 'CASH') {
    setMessage('')
    if (!selectedCourt) return setMessage('Select a court')
    if (!date || !time) return setMessage('Please choose date & time')
    if (!email) return setMessage('Email required to continue')

    setLoading(true)
    try {
      const startIso = new Date(date + 'T' + time + ':00').toISOString()
      const amount = 15000
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courtId: selectedCourt, startTime: startIso, durationMins: duration, amount, paymentMethod })
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data || 'Failed to create booking')
        setLoading(false)
        return
      }

      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject: 'Padel booking confirmation', html: `<p>Your booking is received for ${new Date(startIso).toLocaleString()} on ${courts.find(c=>c.id===selectedCourt)?.name || ''}</p>` })
      })

      setMessage('Booking successful — check your email for details')
      setShowEmailPrompt(false)
    } catch (err: any) {
      setMessage(err.message || 'Error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-8">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x:0, opacity:1 }} transition={{ duration: 0.6 }} className="w-full md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Book a Padel Court — Fast & Easy</h1>
            <p className="text-lg text-gray-600">No account required. Choose your court, pick a time, enter your email and you’re done. Designed to feel like you’re at the court.</p>

            <div className="flex gap-3">
              <a href="#book-section" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow">Book Now</a>
              <button className="inline-flex items-center gap-2 border px-4 py-3 rounded-lg" onClick={()=>document.getElementById('courts-gallery')?.scrollIntoView({behavior:'smooth'})}>See courts</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Quick booking</div>
                <div className="font-semibold">Pick date & time</div>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Pay or Cash</div>
                <div className="font-semibold">Paymob / Cash on arrival</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale:1, opacity:1 }} transition={{ duration: 0.7 }} className="w-full md:w-1/2 rounded-lg overflow-hidden shadow-xl">
            <img src={courtImageUrl('padel court')} alt="Padel court" className="w-full h-72 object-cover" />
          </motion.div>
        </div>
      </section>

      <section id="book-section" className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-4">Choose your court</h2>
        <div id="courts-gallery" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courts.map((c) => (
            <motion.div key={c.id} whileHover={{ y: -6 }} className="bg-white rounded-lg overflow-hidden shadow">
              <div className="h-48 w-full relative">
                <img src={courtImageUrl(c.imageQuery || c.name || 'padel court')} alt={c.name} className="w-full h-full object-cover" />
                <div className="absolute left-3 top-3 bg-black/40 text-white px-3 py-1 rounded">{c.name}</div>
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500">Open: 08:00 — 23:00</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-semibold">From 150 EGP / hour</div>
                  <button onClick={()=>openBooking(c.id)} className="bg-green-600 text-white px-3 py-2 rounded">Reserve</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Quick Reservation</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="border p-2" value={selectedCourt ?? ''} onChange={e=>setSelectedCourt(e.target.value)}>
              {courts.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="border p-2" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            <input className="border p-2" type="time" value={time} onChange={e=>setTime(e.target.value)} />
            <select className="border p-2" value={duration} onChange={e=>setDuration(parseInt(e.target.value))}>
              <option value={30}>30 mins</option>
              <option value={60}>60 mins</option>
              <option value={90}>90 mins</option>
            </select>
          </div>

          <div className="mt-4 flex gap-3 items-center">
            <button onClick={()=>setShowEmailPrompt(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Continue to reserve</button>
            <div className="text-sm text-gray-500">No login required — we only ask for an email to complete the reservation</div>
          </div>
        </div>
      </section>

      {showEmailPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ scale: 0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration: 0.12 }} className="bg-white rounded-lg w-full max-w-md p-6">
            <h4 className="text-lg font-semibold">Enter your email to continue</h4>
            <p className="text-sm text-gray-500">We will send booking details to this address.</p>
            <input className="border p-2 w-full mt-4" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />

            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 border rounded" onClick={()=>setShowEmailPrompt(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={()=>confirmBooking('CASH')} disabled={loading}>{loading ? 'Booking...' : 'Confirm (Cash on arrival)'}</button>
            </div>

            {message && <div className="mt-3 text-sm text-red-600">{message}</div>}
          </motion.div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Padel Club — Reserve a court in seconds.
      </footer>
    </div>
  )
}
