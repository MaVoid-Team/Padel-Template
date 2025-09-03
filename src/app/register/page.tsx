'use client'
import { useState } from "react"

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [ok, setOk] = useState<string>('')
  async function submit() {
    const res = await fetch('/api/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, password }) })
    setOk(res.ok ? 'Registered! You can login now.' : 'Failed to register')
  }
  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Register</h1>
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2 w-full"/>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full"/>
      <input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} className="border p-2 w-full"/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 w-full"/>
      <button onClick={submit} className="border px-4 py-2">Create account</button>
      <div>{ok}</div>
    </div>
  )
}
