"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando perfil...</div>;
  }

  const role = (session.user as any)?.role || "user";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-12 shadow text-center">
          <div className="mx-auto w-28 h-28 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-6xl mb-8">
            👤
          </div>
          <h1 className="text-4xl font-bold mb-3">Mi Perfil</h1>
          <p className="text-xl text-orange-600 capitalize mb-8">{role}</p>
          <p className="text-gray-600">Email: {session.user?.email}</p>
          
          <div className="mt-12 text-sm text-gray-500">
            Neutral user profile page.<br />
            (Avatar, phone, address, social links, etc. will go here)
          </div>
        </div>
      </div>
    </div>
  );
}
