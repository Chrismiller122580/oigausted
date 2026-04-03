"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function AdminSupport() {
  const [tickets] = useState([
    { id: 1, user: "buyer@demo.com", subject: "Payment issue", status: "Open" },
    { id: 2, user: "seller@demo.com", subject: "Gig not showing", status: "Pending" }
  ])

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Support Tickets</h1>
      <div className="space-y-4">
        {tickets.map(ticket => (
          <div key={ticket.id} className="bg-white border rounded-2xl p-6 flex justify-between">
            <div>
              <p className="font-medium">{ticket.subject}</p>
              <p className="text-sm text-gray-500">{ticket.user}</p>
            </div>
            <Button variant="outline">Reply</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
