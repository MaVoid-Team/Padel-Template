'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

class CalendarErrorBoundary extends React.Component<any, { hasError: boolean; message?: string }> {
  constructor(props:any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error:any) {
    return { hasError: true, message: error?.message }
  }
  componentDidCatch(error:any, info:any) {
    console.error('Calendar rendering error', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <div className="font-semibold">Calendar failed to render</div>
          <div className="text-sm mt-2">{this.state.message ?? 'An error occurred while rendering the calendar.'}</div>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={()=>window.location.reload()}>Retry</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function CalendarAvailability({ courtId }: { courtId?: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [rangeStart, setRangeStart] = useState<string>(()=>{
    const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString()
  })
  const [rangeEnd, setRangeEnd] = useState<string>(()=>{
    const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString()
  })

  useEffect(()=>{
    if (!courtId) {
      // No court selected -> show prompt message instead of a spinner
      setEvents([])
      setLoaded(false)
      return
    }
    async function load() {
      const q = new URLSearchParams({ 
        courtId: courtId!, // 👈 The '!' tells TS this won't be undefined
        start: rangeStart, 
        end: rangeEnd 
      });
      let res
      try {
        res = await fetch('/api/bookings/availability?' + q.toString())
      } catch (err) {
        console.warn('Availability fetch failed (network error)', err)
        // fall through to set dummy below
      }
      if (!res || !res.ok) {
        console.warn('Availability fetch failed', res?.status)
        // Provide a harmless fallback so UI can render
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        const dummy = [{ title: 'Availability not available', start, end, allDay: false, resource: null }]
        setEvents(dummy as any)
        setLoaded(true)
        return
      }
      let data
      try {
        data = await res.json()
      } catch (err) {
        console.warn('Failed to parse availability JSON', err)
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        const dummy = [{ title: 'Availability not available', start, end, allDay: false, resource: null }]
        setEvents(dummy as any)
        setLoaded(true)
        return
      }
      // Sanitize and validate bookings before passing to the calendar
      const raw = Array.isArray(data) ? data : []
      const mapped = raw.map((b:any)=>{
        if (!b) return null
        try {
          const status = b?.status === 'CONFIRMED' ? 'Booked' : 'Pending'
          const titleRaw = `${status} • ${b?.user?.email ?? 'Guest'}`
          const start = b?.startTime ? new Date(b.startTime) : null
          const end = b?.endTime ? new Date(b.endTime) : (start ? new Date(start.getTime()+60*60*1000) : null)
          if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
            console.warn('Skipping booking with invalid dates', b)
            return null
          }
          return {
            title: titleRaw,
            start,
            end,
            allDay: false,
            resource: b
          }
        } catch (err) {
          console.warn('Skipping invalid booking', b, err)
          return null
        }
      }).filter(Boolean as any)

      // Ensure every event has a string title and normalized dates
      const cleaned = mapped.map((e:any)=>{
        const title = (e && (typeof e.title === 'string' ? e.title : String(e.title ?? 'Booked • Guest')))
        return {
          ...e,
          title: title || 'Booked • Guest',
          start: new Date(e.start),
          end: new Date(e.end)
        }
      }).filter((e:any)=> e && typeof e.title === 'string')

      if (cleaned.length !== mapped.length) {
        console.warn('Corrected or dropped invalid events', { mappedCount: mapped.length, cleanedCount: cleaned.length, mappedFirst: mapped[0] })
      }

      console.debug('Loaded availability events:', cleaned.length, cleaned.slice(0,3))
      try {
        // If no events were returned, supply a harmless dummy event so the
        // calendar rendering code always has at least one valid event.
        if (!cleaned || cleaned.length === 0) {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
          const end = new Date(start.getTime() + 60 * 60 * 1000)
          const dummy = [{
            title: 'No bookings available',
            start,
            end,
            allDay: false,
            resource: null
          }]
          console.info('Using dummy availability events as fallback')
          setEvents(dummy as any)
          setLoaded(true)
        } else {
          setEvents(cleaned as any)
          setLoaded(true)
        }
      } catch (err) {
        console.error('Failed to set calendar events', err, cleaned)
        setEvents([])
        setLoaded(true)
      }
    }
    // Reset loaded and events when inputs change so error boundary / calendar remount
    setLoaded(false)
    setEvents([])
    load()
  }, [courtId, rangeStart, rangeEnd])

  const defaultDate = useMemo(()=> new Date(), [])

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Court availability</div>
        <div className="text-sm text-gray-600">Showing upcoming 30 days</div>
      </div>
      {!courtId ? (
        <div className="p-6 text-center text-sm text-gray-500">Select a court to view availability</div>
      ) : loaded ? (
        <CalendarErrorBoundary key={courtId ?? 'shared'}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            defaultDate={defaultDate}
            views={['week','day','agenda']}
            components={{ event: ({ event }: any) => <div>{String(event?.title ?? 'Booked')}</div> }}
          />
        </CalendarErrorBoundary>
      ) : (
        <div className="p-6 text-center text-sm text-gray-500">Loading availability…</div>
      )}
    </div>
  )
}
