'use client'
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-semibold">Login</h1>
      <input placeholder="Email or Phone" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="border p-2 w-full"/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 w-full"/>
      <button onClick={()=>signIn('credentials', { identifier, password, callbackUrl: '/' })} className="border px-4 py-2">Login</button>
      <div className="flex gap-2">
        <button onClick={()=>signIn('google', { callbackUrl: '/' })} className="border px-4 py-2">Google</button>
        <button onClick={()=>signIn('facebook', { callbackUrl: '/' })} className="border px-4 py-2">Facebook</button>
      </div>
      <a href="/register" className="text-blue-600">Create an account</a>
    </div>
  )
}
