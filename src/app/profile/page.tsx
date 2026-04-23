"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Save, Edit2, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  // Load data from session
  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "",
        idNumber: "",
        address: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
      });
    }
  }, [session]);

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        await update();
        toast.success("Perfil actualizado correctamente");
        setIsEditing(false);
      } else {
        toast.error("Error al guardar el perfil");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>;
  }

  const role = (session.user as any)?.role || "user";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="relative mx-auto w-32 h-32 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-7xl mb-6">
            👤
            <button className="absolute -bottom-2 -right-2 bg-white p-3 rounded-full shadow hover:bg-orange-100">
              <Camera size={22} />
            </button>
          </div>
          <h1 className="text-4xl font-bold">{profile.name || "Mi Perfil"}</h1>
          <p className="text-orange-600 mt-1 capitalize">{role}</p>
          <p className="text-gray-500 text-sm">{profile.email}</p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-sm">
          <div className="flex justify-between mb-8">
            <h2 className="text-2xl font-semibold">Información Personal</h2>
            <Button
              variant={isEditing ? "destructive" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <><X size={18} /> Cancelar</> : <><Edit2 size={18} /> Editar</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre Completo</Label>
              <Input
                value={profile.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <Input value={profile.email} disabled className="mt-1 bg-gray-100" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={profile.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                placeholder="+57 300 123 4567"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Cédula / ID</Label>
              <Input
                value={profile.idNumber}
                onChange={(e) => handleInputChange("idNumber", e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección</Label>
              <Input
                value={profile.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-10">
            <h3 className="font-semibold mb-4">Redes Sociales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Instagram</Label>
                <Input
                  value={profile.instagram}
                  onChange={(e) => handleInputChange("instagram", e.target.value)}
                  disabled={!isEditing}
                  placeholder="@tuusuario"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input
                  value={profile.facebook}
                  onChange={(e) => handleInputChange("facebook", e.target.value)}
                  disabled={!isEditing}
                  placeholder="facebook.com/tuusuario"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={profile.whatsapp}
                  onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                  disabled={!isEditing}
                  placeholder="+57 300 123 4567"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-10 py-7 text-lg bg-orange-600 hover:bg-orange-700 rounded-2xl"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}