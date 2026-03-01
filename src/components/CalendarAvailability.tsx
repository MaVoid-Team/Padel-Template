'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface ValidEvent {
  title: string
  start: Date
  end: Date
  allDay: boolean
  resource?: any
}

export default function CalendarAvailability({ courtId }: { courtId?: string }) {
  const [events, setEvents] = useState<ValidEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rangeStart] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString()
  })
  const [rangeEnd] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString()
  })

  useEffect(() => {
    if (!courtId) {
      setEvents([])
      setLoaded(false)
      setError(null)
      return
    }

    async function load() {
      try {
        const q = new URLSearchParams({
          courtId,
          start: rangeStart,
          end: rangeEnd
        })
        
        const res = await fetch('/api/bookings/availability?' + q.toString())
        
        if (!res.ok) {
          console.warn('Availability fetch failed', res.status)
          setEvents([])
          setLoaded(true)
          return
        }

        const data = await res.json()
        const raw = Array.isArray(data) ? data : []

        // Map and validate each booking into a proper event
        const validEvents: ValidEvent[] = raw
          .filter((b: any) => b && typeof b === 'object')
          .map((b: any) => {
            try {
              const startStr = b?.startTime
              const endStr = b?.endTime

              if (!startStr || !endStr) return null

              const start = new Date(startStr)
              const end = new Date(endStr)

              if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

              const status = b?.status === 'CONFIRMED' ? 'Booked' : 'Pending'
              const email =
                typeof b?.user?.email === 'string' ? b.user.email : 'Guest'

              return {
                title: `${status} • ${email}`,
                start,
                end,
                allDay: false,
                resource: b
              } as ValidEvent
            } catch (err) {
              console.warn('Error mapping booking', b, err)
              return null
            }
          })
          .filter((e: ValidEvent | null): e is ValidEvent => e !== null)

        if (validEvents.length === 0) {
          // No bookings — provide empty state
          const now = new Date()
          const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            9,
            0,
            0
          )
          const end = new Date(start.getTime() + 60 * 60 * 1000)
          setEvents([
            {
              title: 'No bookings this month',
              start,
              end,
              allDay: false,
              resource: null
            }
          ])
        } else {
          setEvents(validEvents)
        }

        setLoaded(true)
        setError(null)
      } catch (err) {
        console.error('Failed to load availability', err)
        setLoaded(true)
        setError('Failed to load availability')
        setEvents([])
      }
    }

    setLoaded(false)
    load()
  }, [courtId, rangeStart, rangeEnd])

  const defaultDate = useMemo(() => new Date(), [])

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Court availability</div>
        <div className="text-sm text-gray-600">Showing upcoming 30 days</div>
      </div>

      {!courtId ? (
        <div className="p-6 text-center text-sm text-gray-500">
          Select a court to view availability
        </div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-600">{error}</div>
      ) : !loaded ? (
        <div className="p-6 text-center text-sm text-gray-500">
          Loading availability…
        </div>
      ) : events.length > 0 ? (
        <div style={{ height: 500 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            defaultDate={defaultDate}
            views={['week', 'day', 'agenda']}
            defaultView="week"
            eventPropGetter={() => ({
              className: 'bg-blue-100 border-blue-300'
            })}
          />
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-gray-500">
          No bookings in the next 30 days
        </div>
      )}
    </div>
  )
}
