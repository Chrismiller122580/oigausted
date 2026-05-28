'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Sparkles, Share2, MapPin, Phone, Award, Star, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [realStats, setRealStats] = useState({ rating: 0, reviewCount: 0, gigCount: 0 });
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    bio: "",
    phone: "",
    whatsapp: "",
    city: "",
    instagram: "",
    facebook: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setFormData({
        name: user.name || "",
        tagline: user.tagline || "",
        bio: user.bio || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        city: user.city || "",
        instagram: user.instagram || "",
        facebook: user.facebook || "",
        imageUrl: user.image || user.profilePicture || "",
      });

      // Load real reputation data for sellers
      if (user.role === 'seller' && user.id) {
        setRealStats({
          rating: user.rating || 0,
          reviewCount: user.reviewCount || 0,
          gigCount: 0
        });

        // Fetch recent reviews
        fetch(`/api/reviews?sellerId=${user.id}&limit=3`)
          .then(r => r.json())
          .then(data => setRecentReviews(data.reviews || []))
          .catch(() => {});

        // Fetch gig count
        fetch('/api/seller/gigs')
          .then(r => r.json())
          .then(data => setRealStats(prev => ({ ...prev, gigCount: data.count || 0 })))
          .catch(() => {});
      }
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await res.json();

      if (!res.ok) {
        if (data.uploadDisabled) {
          toast.error("Subida de archivos no disponible en este entorno. Usa el campo 'URL de imagen' abajo.");
          // Scroll to the manual URL field
          setTimeout(() => {
            const urlInput = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
            if (urlInput) urlInput.focus();
          }, 300);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } else if (data.url) {
        setFormData({ ...formData, imageUrl: data.url });
        toast.success("Imagen subida correctamente");
      }
    } catch (err: any) {
      toast.error(err.message || "Error subiendo la foto. Usa el campo URL de imagen abajo.");
    } finally {
      setUploading(false);
    }
  };

  const generateBio = async () => {
    if (!formData.name) return toast.error("Escribe tu nombre primero");
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.name,
          category: "Perfil Personal",
          type: 'bio'
        })
      });
      const data = await res.json();
      if (data.description || data.reply) {
        setFormData(prev => ({ ...prev, bio: data.description || data.reply }));
        toast.success("Bio generada con Grok");
      }
    } catch (err) {
      toast.error("No se pudo generar la bio");
    }
  };

  const copyProfileLink = () => {
    const user = session?.user as any;
    const link = user?.role === 'seller' 
      ? `${window.location.origin}/sellers/${user.id}`
      : `${window.location.origin}/profile`;
    
    navigator.clipboard.writeText(link);
    toast.success("Enlace del perfil copiado");
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        // Force session update with latest data so UI reflects immediately
        await update({
          ...formData,
          image: formData.imageUrl,
          profilePicture: formData.imageUrl,
        });
        setIsEditing(false);
        toast.success("Perfil actualizado correctamente");
      } else {
        const err = await res.json().catch(() => ({}));
        
        if (res.status === 401) {
          toast.error("Tu sesión expiró. Por favor inicia sesión de nuevo.");
          router.push(`/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl('/profile'))}`);
        } else {
          toast.error(err.error || "Error al guardar el perfil");
        }
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const user = session?.user as any;
  
  // Local state to reflect role changes without full reload
  const [currentRole, setCurrentRole] = useState(user?.role || 'buyer');
  const isSeller = currentRole === 'seller';
  const isBuyer = currentRole === 'buyer' || !currentRole;

  const [showBecomeSeller, setShowBecomeSeller] = useState(false);
  const [becomingSeller, setBecomingSeller] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    businessName: '',
    nit: '',
    bio: '',
  });

  const handleBecomeSeller = async () => {
    if (!sellerForm.businessName.trim()) {
      return toast.error("El nombre del negocio es obligatorio");
    }

    setBecomingSeller(true);
    try {
      const res = await fetch('/api/user/become-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          businessName: sellerForm.businessName,
          nit: sellerForm.nit,
          bio: sellerForm.bio || formData.bio,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("¡Felicidades! Ahora eres vendedor");
        await update(); // refresh session data
        
        // Optimistic update for smooth UX (no full reload)
        setCurrentRole('seller');
        setShowBecomeSeller(false);
        
        // Show next steps message
        setTimeout(() => {
          toast.success("¡Listo! Ya puedes publicar tu primer gig", { duration: 5000 });
        }, 1200);
      } else {
        toast.error(data.error || "No se pudo completar el proceso");
      }
    } catch (err) {
      toast.error("Error al convertirte en vendedor");
    } finally {
      setBecomingSeller(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold">Mi Perfil</h1>
            <div className="mt-1">
              {isSeller && (
                <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-medium">
                  Vendedor
                </span>
              )}
              {isBuyer && (
                <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                  Comprador
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={copyProfileLink} variant="outline">
              <Share2 size={18} className="mr-2" /> Compartir Perfil
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "default" : "outline"}>
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden shadow-2xl">
          <div className="h-64 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 relative">
            <div className="absolute -bottom-16 left-10">
              <label className="cursor-pointer">
                <div className="w-32 h-32 bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-100">👤</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="text-white" size={32} />
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 px-10 pb-12">
            {/* Seller Quick Links */}
            {isSeller && !isEditing && (
              <div className="mb-8 flex flex-wrap gap-3">
                <Link href="/seller/profile">
                  <Button variant="outline" className="flex items-center gap-2">
                    Mi Negocio <ExternalLink size={16} />
                  </Button>
                </Link>
                <Link href={`/sellers/${user?.id}`} target="_blank">
                  <Button variant="outline" className="flex items-center gap-2">
                    Ver perfil público <ExternalLink size={16} />
                  </Button>
                </Link>
                <Link href="/create-gig">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Publicar nuevo gig
                  </Button>
                </Link>
              </div>
            )}

            {/* Become a Seller CTA for Buyers */}
            {isBuyer && !isEditing && (
              <div className="mb-10 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-orange-800 mb-2">
                      ¿Quieres empezar a vender tus servicios?
                    </h3>
                    <p className="text-orange-700 mb-4">
                      Únete a cientos de profesionales locales que ya están generando ingresos en OigaUsted.
                    </p>
                    <ul className="text-sm text-orange-600 space-y-1">
                      <li>✓ Publica tus propios gigs</li>
                      <li>✓ Recibe pedidos y ganancias directas</li>
                      <li>✓ Construye tu reputación con reseñas</li>
                    </ul>
                  </div>
                  <div className="lg:shrink-0">
                    <Button 
                      onClick={() => setShowBecomeSeller(true)} 
                      className="w-full lg:w-auto bg-orange-600 hover:bg-orange-700 text-lg px-10 py-6 rounded-2xl"
                    >
                      Convertirme en Vendedor
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Become Seller Form */}
            {showBecomeSeller && isBuyer && (
              <div className="mb-10 bg-white border border-orange-200 rounded-3xl p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold">Datos de tu Negocio</h3>
                  <p className="text-muted-foreground mt-1">Esta información aparecerá en tu perfil público de vendedor.</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nombre del Negocio <span className="text-red-500">*</span></label>
                    <Input 
                      value={sellerForm.businessName} 
                      onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })}
                      placeholder="Ej: Limpieza Profesional Bucaramanga"
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Este nombre se mostrará a tus clientes.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">NIT (opcional)</label>
                      <Input 
                        value={sellerForm.nit} 
                        onChange={(e) => setSellerForm({ ...sellerForm, nit: e.target.value })}
                        placeholder="Ej: 901234567-8"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Descripción corta (opcional)</label>
                      <Input 
                        value={sellerForm.bio} 
                        onChange={(e) => setSellerForm({ ...sellerForm, bio: e.target.value })}
                        placeholder="Limpieza profunda de hogares y oficinas"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <Button 
                    onClick={handleBecomeSeller} 
                    disabled={becomingSeller || !sellerForm.businessName.trim()}
                    className="flex-1 py-6 text-lg bg-orange-600 hover:bg-orange-700"
                  >
                    {becomingSeller ? "Procesando..." : "Confirmar y Convertirme en Vendedor"}
                  </Button>
                  <Button 
                    onClick={() => setShowBecomeSeller(false)} 
                    variant="outline"
                    className="flex-1 py-6 text-lg"
                    disabled={becomingSeller}
                  >
                    Cancelar
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Podrás editar más detalles (fotos, redes, etc.) en la sección <strong>Mi Negocio</strong> después.
                </p>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-8">
                <Input name="name" value={formData.name} onChange={handleChange} className="text-4xl font-bold" placeholder="Tu nombre" />
                <Input name="tagline" value={formData.tagline} onChange={handleChange} placeholder="Tagline o profesión" />
                <div className="flex justify-between items-center">
                  <label className="font-medium">Biografía</label>
                  <button onClick={generateBio} className="text-orange-600 flex items-center gap-1 text-sm">
                    <Sparkles size={16} /> Generar con Grok
                  </button>
                </div>
                <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={5} placeholder="Cuéntanos sobre ti..." />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" />
                  <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" />
                  <Input name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad" />
                  <Input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram" />
                  <Input name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Facebook" />
                  <Input 
                    name="imageUrl" 
                    value={formData.imageUrl} 
                    onChange={handleChange} 
                    placeholder="URL de imagen de perfil (o sube una arriba)" 
                  />
                </div>

                <Button onClick={saveProfile} disabled={loading} className="w-full py-6 text-lg">
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                  <h2 className="text-5xl font-bold">{formData.name || "Tu Nombre"}</h2>
                  <p className="text-2xl text-orange-600 mt-2">{formData.tagline}</p>
                </div>

                <p className="text-lg text-gray-700 leading-relaxed">{formData.bio || "Sin biografía aún."}</p>

                <div className="flex flex-wrap gap-x-10 gap-y-4 text-lg">
                  {formData.city && <div className="flex items-center gap-3"><MapPin /> {formData.city}</div>}
                  {formData.phone && <div className="flex items-center gap-3"><Phone /> {formData.phone}</div>}
                  {formData.whatsapp && <div className="flex items-center gap-3">💬 {formData.whatsapp}</div>}
                  {formData.instagram && <div className="flex items-center gap-3">📷 {formData.instagram}</div>}
                </div>

                {/* Seller Reputation Section */}
                {isSeller && (
                  <div className="bg-white border rounded-3xl p-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-8 h-8 text-orange-600" />
                          <span className="font-semibold text-xl">Tu Reputación</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-yellow-600">
                            {realStats.rating ? realStats.rating.toFixed(1) : "—"}
                          </span>
                          <span className="text-2xl text-yellow-500">★</span>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {realStats.reviewCount} reseñas • {realStats.gigCount} servicios
                        </p>
                      </div>

                      <Link href={`/sellers/${(session?.user as any)?.id}`} target="_blank">
                        <Button variant="outline" className="flex items-center gap-2">
                          Ver perfil público <ExternalLink size={16} />
                        </Button>
                      </Link>
                    </div>

                    {/* Mini recent reviews */}
                    {recentReviews.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <p className="text-sm font-medium text-gray-500 mb-3">Últimas reseñas</p>
                        <div className="space-y-3">
                          {recentReviews.map((r, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                              <div className="flex text-yellow-500 shrink-0">
                                {[1,2,3,4,5].map(n => <span key={n}>{n <= r.rating ? "★" : "☆"}</span>)}
                              </div>
                              <p className="text-gray-600 line-clamp-2">"{r.comment || 'Sin comentario'}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
