"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-lg mx-auto bg-white rounded-3xl p-12 shadow text-center">
        <div className="mx-auto w-28 h-28 bg-orange-500 rounded-full flex items-center justify-center text-white text-6xl mb-8">
          👤
        </div>
        <h1 className="text-4xl font-bold mb-3">Mi Perfil</h1>
        <p className="text-xl text-gray-600 mb-8">
          {session.user?.name} • {(session.user as any)?.role || "Usuario"}
        </p>
        <p className="text-gray-500">Email: {session.user?.email}</p>
        
        <div className="mt-12 text-sm text-gray-400">
          Neutral user profile page.<br />
          (Avatar, personal data, settings will go here)
        </div>
      </div>
    </div>
  );
}