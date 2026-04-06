"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit2, Save, X } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "buyer" | "seller" | "admin"
  businessName?: string
  nit?: string
  phone?: string
  bio?: string
  createdAt?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<User>>({})

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem("oigausted-users") || "[]")
    if (savedUsers.length === 0) {
      const demoUsers: User[] = [
        { id: "1", name: "Buyer Demo", email: "buyer@demo.com", role: "buyer" },
        { id: "2", name: "Ana Seller", email: "seller@demo.com", role: "seller", businessName: "Ana Servicios", phone: "3001234567" },
        { id: "3", name: "Admin User", email: "admin@demo.com", role: "admin" }
      ]
      localStorage.setItem("oigausted-users", JSON.stringify(demoUsers))
      setUsers(demoUsers)
    } else {
      setUsers(savedUsers)
    }
  }, [])

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setFormData({ ...user })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({})
  }

  const saveEdit = () => {
    if (!editingId) return
    const updatedUsers = users.map(u => 
      u.id === editingId ? { ...u, ...formData } : u
    )
    localStorage.setItem("oigausted-users", JSON.stringify(updatedUsers))
    setUsers(updatedUsers)
    setEditingId(null)
    setFormData({})
    alert("✅ Usuario actualizado correctamente")
  }

  const deleteUser = (id: string) => {
    if (!confirm("¿Eliminar este usuario permanentemente?")) return
    const updatedUsers = users.filter(u => u.id !== id)
    localStorage.setItem("oigausted-users", JSON.stringify(updatedUsers))
    setUsers(updatedUsers)
    alert("✅ Usuario eliminado")
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Gestión de Usuarios</h1>
        <div className="text-gray-400">Total: {users.length} usuarios</div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left p-4">Nombre</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Rol</th>
                <th className="text-left p-4">Negocio</th>
                <th className="text-left p-4">Teléfono</th>
                <th className="text-right p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="p-4">
                    {editingId === user.id ? (
                      <Input 
                        value={formData.name || ""} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    ) : user.name}
                  </td>
                  <td className="p-4">
                    {editingId === user.id ? (
                      <Input 
                        value={formData.email || ""} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    ) : user.email}
                  </td>
                  <td className="p-4">
                    {editingId === user.id ? (
                      <Select 
                        value={formData.role} 
                        onValueChange={(value: any) => setFormData({...formData, role: value})}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Comprador</SelectItem>
                          <SelectItem value="seller">Vendedor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        user.role === "admin" ? "bg-purple-900 text-purple-300" :
                        user.role === "seller" ? "bg-orange-900 text-orange-300" : "bg-blue-900 text-blue-300"
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === user.id ? (
                      <Input 
                        value={formData.businessName || ""} 
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    ) : (user.businessName || "-")}
                  </td>
                  <td className="p-4">
                    {editingId === user.id ? (
                      <Input 
                        value={formData.phone || ""} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    ) : (user.phone || "-")}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {editingId === user.id ? (
                      <>
                        <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                          <Save size={16} className="mr-1" /> Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="border-gray-700">
                          <X size={16} className="mr-1" /> Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(user)} className="border-gray-700 hover:bg-gray-800">
                          <Edit2 size={16} className="mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>
                          <Trash2 size={16} className="mr-1" /> Eliminar
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
