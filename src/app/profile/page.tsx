"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Save, Edit2, X, AlertCircle } from "lucide-react"
import GrokAssistant from "@/components/common/GrokAssistant"

interface ProfileData {
  name: string
  email: string
  phone: string
  idNumber: string
  address: string
  instagram?: string
  facebook?: string
  whatsapp?: string
}

interface FormErrors {
  name?: string
  phone?: string
  idNumber?: string
  address?: string
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "+57 300 123 4567",
    idNumber: "1.234.567.890",
    address: "Calle 45 #12-34, Bucaramanga",
    instagram: "@tuusuario",
    facebook: "facebook.com/tuusuario",
    whatsapp: "+57 300 123 4567"
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Load initial data
  useEffect(() => {
    if (session?.user) {
      setProfile(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }))
    }
  }, [session])

  // Validación en tiempo real
  const validateField = (field: keyof ProfileData, value: string) => {
    const newErrors = { ...errors }

    if (field === 'name') {
      if (!value || value.trim().length < 3) {
        newErrors.name = "El nombre debe tener al menos 3 caracteres"
      } else {
        delete newErrors.name
      }
    }

    if (field === 'phone') {
      const phoneRegex = /^\+57 \d{3} \d{3} \d{4}$/
      if (!phoneRegex.test(value)) {
        newErrors.phone = "Formato inválido. Usa +57 300 123 4567"
      } else {
        delete newErrors.phone
      }
    }

    if (field === 'idNumber') {
      if (!value || value.trim().length < 8) {
        newErrors.idNumber = "La cédula debe tener al menos 8 caracteres"
      } else {
        delete newErrors.idNumber
      }
    }

    if (field === 'address') {
      if (!value || value.trim().length < 10) {
        newErrors.address = "La dirección debe ser más completa"
      } else {
        delete newErrors.address
      }
    }

    setErrors(newErrors)
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const isFormValid = Object.keys(errors).length === 0 && profile.name.trim().length > 2

  const handleSave = async () => {
    if (!isFormValid) return

    setLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (res.ok) {
        await update()
        alert("✅ Perfil actualizado correctamente")
        setIsEditing(false)
        setErrors({})
      } else {
        alert("❌ Error al guardar el perfil")
      }
    } catch (error) {
      alert("❌ Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>
  }

  const isSeller = (session?.user as any)?.role?.toLowerCase() === "seller"

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative mx-auto w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-6xl mb-4">
            👤
            <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-orange-100 transition">
              <Camera size={20} className="text-gray-700" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-orange-600 font-medium">{isSeller ? "Vendedor" : "Comprador"}</p>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Información Personal</h2>
            <Button
              variant={isEditing ? "destructive" : "default"}
              onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
              className="flex items-center gap-2"
            >
              {isEditing ? <><X size={18} /> Cancelar</> : <><Edit2 size={18} /> Editar</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre Completo</Label>
              <Input 
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
            </div>
            <div>
              <Label>Correo Electrónico</Label>
              <Input value={profile.email} disabled className="mt-1 bg-gray-100" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input 
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+57 300 123 4567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.phone}</p>}
            </div>
            <div>
              <Label>Cédula / ID</Label>
              <Input 
                value={profile.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                disabled={!isEditing}
                className={`mt-1 ${errors.idNumber ? 'border-red-500' : ''}`}
              />
              {errors.idNumber && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.idNumber}</p>}
            </div>
          </div>

          <div className="mt-6">
            <Label>Dirección</Label>
            <Input 
              value={profile.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={!isEditing}
              className={`mt-1 ${errors.address ? 'border-red-500' : ''}`}
            />
            {errors.address && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <Label>Instagram</Label>
              <Input 
                value={profile.instagram}
                onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input 
                value={profile.facebook}
                onChange={(e) => setProfile({...profile, facebook: e.target.value})}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input 
                value={profile.whatsapp}
                onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>

          {isEditing && (
            <Button 
              onClick={handleSave}
              disabled={loading || !isFormValid}
              className="w-full mt-8 bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Guardando..." : <><Save size={20} /> Guardar Cambios</>}
            </Button>
          )}
        </div>

        {/* Become Seller Button - ONLY for buyers */}
        {!isSeller && (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">¿Quieres vender tus servicios?</h3>
            <p className="text-gray-600 mb-6">Únete a miles de vendedores locales y empieza a ganar dinero.</p>
            <Button 
              onClick={() => router.push("/api/user/become-seller")}
              className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-6 text-lg rounded-2xl"
            >
              Quiero ser Vendedor
            </Button>
          </div>
        )}

        <GrokAssistant />
      </div>
    </div>
  )
}
