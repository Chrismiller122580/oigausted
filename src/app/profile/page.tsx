"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Camera, MapPin, Store, User } from "lucide-react"
import GrokAssistant from "@/components/common/GrokAssistant"

export default function PersonalProfile() {
  const router = useRouter()

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    profilePicture: ""
  })

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [nit, setNit] = useState("")
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState<"buyer" | "seller">("buyer")
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const savedUserStr = localStorage.getItem("oigausted-user")
    if (savedUserStr) {
      try {
        const user = JSON.parse(savedUserStr)
        setUserId(user.id)
        setCurrentRole(user.role || "buyer")
        setProfileData(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          profilePicture: user.profilePicture || ""
        }))
      } catch (e) {}
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)

    try {
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setProfileData(prev => ({ ...prev, profilePicture: data.imageUrl }))
        alert("Foto de perfil subida correctamente")
      }
    } catch (error) {
      alert("Error al subir la foto")
    }
  }

  const saveProfile = () => {
    localStorage.setItem("oigausted-personal-profile", JSON.stringify(profileData))
    alert("✅ Perfil guardado")
  }

  const handleBecomeSeller = async () => {
    if (!businessName.trim()) {
      alert("Por favor ingresa el nombre de tu negocio")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/become-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          businessName: businessName.trim(),
          nit: nit.trim() || null,
          bio: bio.trim() || null
        })
      })

      if (response.ok) {
        const savedUserStr = localStorage.getItem("oigausted-user")
        if (savedUserStr) {
          const currentUser = JSON.parse(savedUserStr)
          localStorage.setItem("oigausted-user", JSON.stringify({
            ...currentUser,
            role: "seller",
            businessName: businessName.trim(),
            nit: nit.trim() || null,
            bio: bio.trim() || null
          }))
        }

        setCurrentRole("seller")
        alert("¡Felicidades! Ahora eres un Vendedor.")
        window.location.reload()
      } else {
        alert("Error al actualizar rol")
      }
    } catch (error) {
      alert("Error de conexión")
    } finally {
      setLoading(false)
      setIsSellerModalOpen(false)
    }
  }

  const isBuyer = currentRole === "buyer"

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4 relative min-h-screen">
      <GrokAssistant />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <User className="text-yellow-600" /> Mi Perfil Personal
        </h1>
        <Button onClick={() => router.push("/")} variant="outline">
          ← Volver al Inicio
        </Button>
      </div>

      {/* Profile Picture */}
      <Card className="mb-8">
        <CardContent className="pt-8 pb-6 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            {profileData.profilePicture ? (
              <img 
                src={profileData.profilePicture} 
                alt="Foto de perfil" 
                className="w-32 h-32 rounded-full object-cover border-4 border-yellow-600 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-yellow-600">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-700 text-white p-2.5 rounded-full cursor-pointer shadow">
              <Camera size={20} />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">Haz clic en la cámara para subir tu foto</p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre Completo</Label>
              <Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="mt-2" />
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <Input value={profileData.email} disabled className="mt-2 bg-gray-100" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} placeholder="+57 300 123 4567" className="mt-2" />
            </div>
            <div>
              <Label>Cédula / ID</Label>
              <Input value={profileData.idNumber} onChange={(e) => setProfileData({...profileData, idNumber: e.target.value})} placeholder="1.234.567.890" className="mt-2" />
            </div>
          </div>

          <div>
            <Label>Dirección</Label>
            <Input value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} placeholder="Calle 45 #12-34, Bucaramanga" className="mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Instagram</Label>
              <Input value={profileData.instagram} onChange={(e) => setProfileData({...profileData, instagram: e.target.value})} placeholder="@tuusuario" className="mt-2" />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={profileData.facebook} onChange={(e) => setProfileData({...profileData, facebook: e.target.value})} placeholder="facebook.com/tuusuario" className="mt-2" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={profileData.whatsapp} onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})} placeholder="+57 300 123 4567" className="mt-2" />
            </div>
          </div>

          <Button onClick={saveProfile} className="w-full">
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      {isBuyer && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Button 
              onClick={() => setIsSellerModalOpen(true)}
              size="lg"
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-7 text-lg px-12"
            >
              <Store className="mr-3" /> Quiero ser Vendedor
            </Button>
          </CardContent>
        </Card>
      )}

      {isSellerModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6">Conviértete en Vendedor</h2>
            <div className="space-y-6">
              <div>
                <Label>Nombre del Negocio *</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ej: Limpieza Rápida Bucaramanga" className="mt-2" />
              </div>
              <div>
                <Label>NIT (opcional)</Label>
                <Input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="123456789-0" className="mt-2" />
              </div>
              <div>
                <Label>Breve descripción</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Ofrecemos limpieza profunda..." className="mt-2 h-24" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsSellerModalOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleBecomeSeller} disabled={loading || !businessName.trim()} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                {loading ? "Procesando..." : "Confirmar y Ser Vendedor"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
