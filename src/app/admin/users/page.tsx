"use client"

import { useState, useEffect } from "react"

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    // Mock users for demo
    setUsers([
      { id: 1, name: "Buyer Demo", email: "buyer@demo.com", role: "buyer" },
      { id: 2, name: "Ana Seller", email: "seller@demo.com", role: "seller" },
      { id: 3, name: "Admin User", email: "admin@demo.com", role: "admin" }
    ])
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Users Management</h1>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4 capitalize">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
