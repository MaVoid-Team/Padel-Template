'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

export default function CalendarAvailability({ courtId }: { courtId?: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [rangeStart, setRangeStart] = useState<string>(()=>{
    const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString()
  })
  const [rangeEnd, setRangeEnd] = useState<string>(()=>{
    const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString()
  })

  useEffect(()=>{
    if (!courtId) return
    async function load() {
      const q = new URLSearchParams({ courtId, start: rangeStart, end: rangeEnd })
      const res = await fetch('/api/bookings/availability?' + q.toString())
      if (!res.ok) return
      const data = await res.json()
      const ev = data.map((b:any)=> ({
        title: (b.status==='CONFIRMED' ? 'Booked' : 'Pending') + ' • ' + (b.user?.email || 'Guest'),
        start: new Date(b.startTime),
        end: new Date(b.endTime),
        allDay: false,
        resource: b
      }))
      setEvents(ev)
    }
    load()
  }, [courtId, rangeStart, rangeEnd])

  const defaultDate = useMemo(()=> new Date(), [])

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Court availability</div>
        <div className="text-sm text-gray-600">Showing upcoming 30 days</div>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        defaultDate={defaultDate}
        views={['week','day','agenda']}
      />
    </div>
  )
}
