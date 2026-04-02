"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    let savedUsers = localStorage.getItem("oigausted-users")
    if (!savedUsers) {
      savedUsers = JSON.stringify([
        { id: "1", name: "Chris Buyer", email: "buyer@demo.com", role: "buyer" },
        { id: "2", name: "Ana Seller", email: "seller@demo.com", role: "seller" },
        { id: "3", name: "Admin", email: "admin@demo.com", role: "admin" },
        { id: "4", name: "Chris Miller", email: "chris@demo.com", role: "admin" },
      ])
      localStorage.setItem("oigausted-users", savedUsers)
    }
    setUsers(JSON.parse(savedUsers))
  }, [])

  const changeRole = (userId: string, newRole: string) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    )
    setUsers(updatedUsers)
    localStorage.setItem("oigausted-users", JSON.stringify(updatedUsers))
    showToast(`Rol cambiado a ${newRole}`, "success")
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Gestión de Usuarios</h1>
        
        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
          <div className="space-y-6">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center border-b border-gray-700 pb-6 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="capitalize px-5 py-2 bg-gray-800 rounded-full text-sm font-medium">
                    {user.role}
                  </span>
                  <select 
                    value={user.role} 
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="buyer">Comprador</option>
                    <option value="seller">Vendedor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
