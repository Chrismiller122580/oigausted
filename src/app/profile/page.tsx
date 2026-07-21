'use client';

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Sparkles, Share2, MapPin, Phone, Award, Star, ExternalLink, Eye, EyeOff, Lock, MessageCircle, Instagram, Bell, Trash2, AlertTriangle } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { toast } from 'sonner';
import MapsPollutionNuke from "@/components/maps/MapsPollutionNuke";
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl";
import { trackEvent } from '@/lib/analytics';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [realStats, setRealStats] = useState({ rating: 0, reviewCount: 0, gigCount: 0 });
  const [recentReviews, setRecentReviews] = useState<import('@/types/order').OrderReview[]>([]);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Account deletion state
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteAllData, setDeleteAllData] = useState(true);

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
    coverImageUrl: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (session?.user) {
      const user = session.user;
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
        coverImageUrl: user.coverImageUrl || "",
        latitude: user.latitude || null,
        longitude: user.longitude || null,
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

  const persistProfile = async (
    patch: Partial<typeof formData>,
    options?: { exitEditMode?: boolean; successMessage?: string }
  ) => {
    const payload = { ...formData, ...patch };
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData(payload);
        await update({
          ...payload,
          image: payload.imageUrl,
          profilePicture: payload.imageUrl,
          coverImageUrl: payload.coverImageUrl,
        });
        if (options?.exitEditMode) setIsEditing(false);
        toast.success(options?.successMessage || "Perfil actualizado correctamente");
        return true;
      }

      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        toast.error("Tu sesión expiró. Por favor inicia sesión de nuevo.");
        router.push(`/login?callbackUrl=${encodeURIComponent(getAuthCallbackUrl('/profile'))}`);
      } else {
        toast.error(err.error || "Error al guardar el perfil");
      }
      return false;
    } catch {
      toast.error("Error de conexión");
      return false;
    } finally {
      setLoading(false);
    }
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
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        await persistProfile({ imageUrl: data.url }, { successMessage: "Foto de perfil guardada" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error subiendo la foto. Usa el campo URL de imagen abajo.");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          toast.error("Subida de archivos no disponible en este entorno. Usa el campo 'URL de imagen de fondo' abajo.");
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } else if (data.url) {
        setFormData(prev => ({ ...prev, coverImageUrl: data.url }));
        await persistProfile({ coverImageUrl: data.url }, { successMessage: "Foto de fondo guardada" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error subiendo la foto de fondo.");
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
    const user = session?.user;
    const link = user?.role === 'seller' 
      ? `${window.location.origin}/sellers/${user.slug || user.id}`
      : `${window.location.origin}/profile`;
    
    navigator.clipboard.writeText(link);
    toast.success("Enlace del perfil copiado");
  };

  const saveProfile = async () => {
    await persistProfile(formData, { exitEditMode: true });
  };

  const user = session?.user;
  
  // Local state to reflect role changes without full reload
  const [currentRole, setCurrentRole] = useState(user?.role || 'buyer');

  useEffect(() => {
    if (session?.user?.role) {
      setCurrentRole(session.user.role);
    }
  }, [session?.user?.role]);

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
    if (!user?.id) {
      return toast.error("Debes iniciar sesión");
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
        trackEvent('become_seller');
        toast.success("¡Felicidades! Ahora eres vendedor");
        await update({
          role: 'seller',
          businessName: sellerForm.businessName,
          bio: sellerForm.bio || formData.bio,
        });

        setCurrentRole('seller');
        setShowBecomeSeller(false);

        // Clear tutorial flags so the seller tutorial automatically appears when they visit /seller
        // (per requirement: when buyer becomes seller the tutorial re-appears for the newly unlocked features)
        const uid = user?.id || session?.user?.id;
        if (uid) {
          localStorage.removeItem(`tutorial_buyer_${uid}`);
          localStorage.removeItem(`tutorial_seller_${uid}`);
        }
        
        // Show next steps message
        setTimeout(() => {
          toast.success("¡Listo! Ya puedes publicar tu primer gig. El tutorial de vendedor aparecerá en tu dashboard.", { duration: 6000 });
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword || undefined,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Contraseña actualizada exitosamente');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        toast.error(data.error || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      toast.error('Error al cambiar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR') {
      toast.error('Escribe ELIMINAR para confirmar');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: deleteConfirmText.trim(),
          deleteAllData,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar la cuenta');
        return;
      }

      trackEvent('account_deleted', { delete_all_data: deleteAllData });
      toast.success(
        deleteAllData
          ? 'Cuenta y datos personales eliminados'
          : 'Cuenta eliminada. Ya no podrás iniciar sesión.'
      );
      await signOut({ callbackUrl: '/' });
    } catch {
      toast.error('Error de conexión al eliminar la cuenta');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <MapsPollutionNuke />
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
          <div 
            className="h-64 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 relative bg-cover bg-center"
            style={formData.coverImageUrl ? { backgroundImage: `url(${formData.coverImageUrl})` } : {}}
          >
            {/* Background photo upload overlay (camera in top right) */}
            <label className="absolute top-4 right-4 cursor-pointer z-10">
              <div className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition">
                <Camera size={18} />
              </div>
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>

            <div className="absolute -bottom-16 left-10">
              <label className="cursor-pointer">
                <div className="w-32 h-32 bg-card rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserAvatar name={formData.name} size="xl" className="w-full h-full rounded-none border-0 text-7xl" />
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
                <Link href={`/sellers/${user?.slug || user?.id}`} target="_blank">
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
                      Únete a cientos de profesionales locales que ya están generando ingresos en OigaGIG.
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
              <div className="mb-10 bg-card border border-orange-200 rounded-3xl p-8">
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
                  <div>
                    <label className="text-sm font-medium mb-1 block">Ciudad / Dirección</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={formData.city || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Ciudad o dirección"
                        className="flex-1 border rounded-xl px-4 py-3"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator.geolocation) {
                            toast.error("Tu navegador no soporta geolocalización.");
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              const lat = pos.coords.latitude;
                              const lng = pos.coords.longitude;
                              setFormData(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                city: prev.city || `Ubicación actual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                              }));
                            },
                            () => toast.error("No pudimos obtener tu ubicación.")
                          );
                        }}
                        className="px-4 py-5 border border-border rounded-2xl text-sm hover:bg-muted flex items-center justify-center gap-1.5 whitespace-nowrap"
                        title="Usar mi ubicación actual"
                      >
                        <MapPin className="h-4 w-4" />
                        Mi ubicación
                      </button>
                    </div>
                  </div>
                  <Input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram" />
                  <Input name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Facebook" />
                  <Input 
                    name="imageUrl" 
                    value={formData.imageUrl} 
                    onChange={handleChange} 
                    placeholder="URL de imagen de perfil (o sube una arriba)" 
                  />
                  <Input
                    name="coverImageUrl"
                    value={formData.coverImageUrl}
                    onChange={handleChange}
                    placeholder="URL de imagen de fondo (o sube una arriba)"
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

                <p className="text-lg text-foreground leading-relaxed">{formData.bio || "Sin biografía aún."}</p>

                <div className="flex flex-wrap gap-x-10 gap-y-4 text-lg">
                  {formData.city && <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-muted-foreground" /> {formData.city}</div>}
                  {formData.phone && <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-muted-foreground" /> {formData.phone}</div>}
                  {formData.whatsapp && <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-muted-foreground" /> {formData.whatsapp}</div>}
                  {formData.instagram && <div className="flex items-center gap-3"><Instagram className="h-5 w-5 text-muted-foreground" /> {formData.instagram}</div>}
                </div>

                {/* Seller Reputation Section */}
                {isSeller && (
                  <div className="bg-card border rounded-3xl p-8">
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

                      <Link href={`/sellers/${session?.user?.slug || session?.user?.id}`} target="_blank">
                        <Button variant="outline" className="flex items-center gap-2">
                          Ver perfil público <ExternalLink size={16} />
                        </Button>
                      </Link>
                    </div>

                    {/* Mini recent reviews */}
                    {recentReviews.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Últimas reseñas</p>
                        <div className="space-y-3">
                          {recentReviews.map((r, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                              <div className="flex text-yellow-500 shrink-0">
                                {[1,2,3,4,5].map(n => <span key={n}>{n <= r.rating ? "★" : "☆"}</span>)}
                              </div>
                              <p className="text-muted-foreground line-clamp-2">"{r.comment || 'Sin comentario'}"</p>
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

        <Card className="mt-8 border border-border/60">
          <CardContent className="p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Notificaciones</h3>
                  <p className="text-sm text-muted-foreground">
                    Email, push, horario silencioso y resúmenes
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/notifications">Configurar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card className="mt-8 border border-border/60">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Seguridad de la cuenta</h3>
                  <p className="text-sm text-muted-foreground">Actualiza tu contraseña de acceso</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Cancelar' : 'Cambiar'}
              </Button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-4 mt-4 max-w-md">
                <div>
                  <label className="text-sm font-medium">Contraseña actual (si tienes una)</label>
                  <div className="relative mt-1">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Deja en blanco si aún no tienes contraseña"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Nueva contraseña</label>
                  <div className="relative mt-1">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Confirmar nueva contraseña</label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={passwordLoading} className="w-full">
                  {passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Si iniciaste sesión con Google y no tienes contraseña, puedes establecer una aquí.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Danger zone — account deletion (Play Store / privacy requirement) */}
        <Card className="mt-8 border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20">
          <CardContent className="p-8">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">
                    Eliminar cuenta
                  </h3>
                  <p className="text-sm text-red-700/80 dark:text-red-300/80">
                    Cierra tu cuenta de forma permanente. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                onClick={() => {
                  setShowDeleteForm(!showDeleteForm);
                  setDeleteConfirmText('');
                }}
              >
                {showDeleteForm ? 'Cancelar' : 'Eliminar'}
              </Button>
            </div>

            {showDeleteForm && (
              <form onSubmit={handleDeleteAccount} className="mt-6 space-y-5 max-w-lg">
                <div className="flex gap-3 rounded-2xl border border-red-200 dark:border-red-900 bg-card p-4 text-sm">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      Al eliminar tu cuenta se cerrará tu sesión y no podrás volver a entrar con
                      este acceso. Tus gigs se despublicarán.
                    </p>
                    <p>
                      Si tienes pedidos en curso (pendientes, pagados o en progreso), debes
                      completarlos o cancelarlos antes de continuar.
                    </p>
                    <p>
                      El historial de transacciones puede conservarse de forma anónima por
                      obligaciones legales y para la otra parte del pedido.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-border bg-card p-4 hover:bg-muted/40 transition">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border text-red-600 focus:ring-red-500"
                    checked={deleteAllData}
                    onChange={(e) => setDeleteAllData(e.target.checked)}
                  />
                  <span>
                    <span className="block font-medium text-foreground">
                      También eliminar mis datos personales
                    </span>
                    <span className="block text-sm text-muted-foreground mt-0.5">
                      Borra o anonimiza perfil, fotos, notificaciones, preferencias, tickets de
                      soporte, datos de pago y otra información personal asociada a tu cuenta.
                      Recomendado para cumplir con tu derecho a la eliminación de datos.
                    </span>
                  </span>
                </label>

                <div>
                  <label className="text-sm font-medium">
                    Escribe <span className="font-mono text-red-700 dark:text-red-300">ELIMINAR</span> para confirmar
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="ELIMINAR"
                    className="mt-1.5 border-red-200 focus-visible:ring-red-500"
                    autoComplete="off"
                    disabled={deleteLoading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    deleteLoading || deleteConfirmText.trim().toUpperCase() !== 'ELIMINAR'
                  }
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {deleteLoading
                    ? 'Eliminando…'
                    : deleteAllData
                      ? 'Eliminar cuenta y mis datos'
                      : 'Eliminar solo la cuenta'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Más información en nuestra{' '}
                  <Link href="/privacy" className="text-orange-600 hover:underline">
                    Política de privacidad
                  </Link>
                  .
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
