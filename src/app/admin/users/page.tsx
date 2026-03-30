"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ToastProvider"

interface User {
  id: string
  name: string
  email: string
  role: "buyer" | "seller" | "admin"
}

export default function AdminUsers() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr || JSON.parse(userStr).role !== "admin") {
      router.push("/login")
      return
    }
    setCurrentUser(JSON.parse(userStr))

    // Demo users
    setUsers([
      { id: "1", name: "Chris Miller", email: "chris@demo.com", role: "admin" },
      { id: "2", name: "Juan Comprador", email: "buyer@demo.com", role: "buyer" },
      { id: "3", name: "Maria Vendedora", email: "seller@demo.com", role: "seller" },
      { id: "4", name: "Carlos Agro", email: "carlos@demo.com", role: "seller" },
    ])
  }, [router])

  const changeRole = (id: string, newRole: "buyer" | "seller" | "admin") => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, role: newRole } : user
    ))
    showToast(`Rol de usuario actualizado a ${newRole}`, "success")
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">Administra roles y usuarios de la plataforma</p>
        </div>
        <Button onClick={() => router.push("/admin")}>Volver al Dashboard</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar usuarios por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="bg-white border rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-6 font-medium">Nombre</th>
              <th className="text-left p-6 font-medium">Email</th>
              <th className="text-left p-6 font-medium">Rol Actual</th>
              <th className="text-left p-6 font-medium">Cambiar Rol</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-6 font-medium">{user.name}</td>
                <td className="p-6 text-gray-600">{user.email}</td>
                <td className="p-6">
                  <span className={`px-4 py-1 rounded-full text-sm ${
                    user.role === "admin" ? "bg-red-100 text-red-700" :
                    user.role === "seller" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => changeRole(user.id, "buyer")}>Buyer</Button>
                    <Button size="sm" variant="outline" onClick={() => changeRole(user.id, "seller")}>Seller</Button>
                    <Button size="sm" variant="outline" onClick={() => changeRole(user.id, "admin")}>Admin</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
