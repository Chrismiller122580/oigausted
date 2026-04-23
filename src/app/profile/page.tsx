"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;
  }

  const role = (session.user as any)?.role || "user";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-10 shadow-sm">
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-7xl">
              👤
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center">Mi Perfil</h1>
          <p className="text-center text-orange-600 mt-2 capitalize">{role}</p>
          
          <div className="mt-10 space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Nombre</label>
              <p className="text-xl font-medium">{session.user?.name || "Sin nombre"}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Correo</label>
              <p className="text-xl font-medium">{session.user?.email}</p>
            </div>
            <div className="pt-6 border-t text-center text-sm text-gray-500">
              Esta es la página neutral de perfil de usuario.<br />
              (Aquí irá edición de datos, contraseña, etc.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}