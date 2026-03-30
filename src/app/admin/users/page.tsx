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
  role: string
  businessName?: string
  nit?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    if (user.role !== "admin") {
      showToast("Acceso denegado. Solo administradores.", "error")
      router.push("/admin")
      return
    }

    // Simulate users list (in real app this would come from DB)
    const demoUsers: User[] = [
      { id: "1", name: "Chris Miller", email: "chris@demo.com", role: "admin" },
      { id: "2", name: "Juan Comprador", email: "buyer@demo.com", role: "buyer" },
      { id: "3", name: "Maria Vendedora", email: "seller@demo.com", role: "seller", businessName: "Diseños Maria", nit: "900123456-7" },
      { id: "4", name: "Carlos López", email: "carlos@demo.com", role: "seller" },
    ]
    setUsers(demoUsers)
  }, [router, showToast])

  const changeUserRole = (userId: string, newRole: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u)
    setUsers(updatedUsers)
    showToast(`Rol de usuario cambiado a ${newRole}`, "success")
    // In real app, save to backend here
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!currentUser || currentUser.role !== "admin") {
    return <div className="container py-12 text-center">Acceso denegado.</div>
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra cuentas y roles</p>
        </div>
        <Button onClick={() => router.push("/admin")}>Volver al Dashboard</Button>
      </div>

      <div className="bg-white border rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Lista de Usuarios</h2>
          <div className="relative w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full border border-gray-300 rounded-full pl-10 py-3 focus:outline-none focus:border-yellow-600"
            />
            <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-6 font-medium">Nombre</th>
                <th className="text-left py-4 px-6 font-medium">Email</th>
                <th className="text-left py-4 px-6 font-medium">Rol Actual</th>
                <th className="text-left py-4 px-6 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-5 px-6 font-medium">{user.name}</td>
                  <td className="py-5 px-6 text-gray-600">{user.email}</td>
                  <td className="py-5 px-6">
                    <span className={`inline-block px-4 py-1 text-xs rounded-full ${
                      user.role === "admin" ? "bg-red-100 text-red-700" :
                      user.role === "seller" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <select 
                      value={user.role}
                      onChange={(e) => changeUserRole(user.id, e.target.value)}
                      className="border rounded px-4 py-2 text-sm focus:outline-none focus:border-yellow-600"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Admin Users Management • Cambia roles según sea necesario
      </div>
    </div>
  )
}
