'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Save, RefreshCw, AlertTriangle, DollarSign, MessageCircle } from 'lucide-react';

// Simple Switch component
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-orange-600' : 'bg-zinc-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

interface PlatformConfig {
  id: string;
  commissionRate: number;
  referralCommissionRate: number;
  minPayoutAmount: number;
  supportEmail: string;
  enableReviews: boolean;
  enableChat: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function AdminSettings() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        toast.error('No se pudo cargar la configuración');
      }
    } catch (e) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('Configuración guardada correctamente');
        fetchConfig();
      } else {
        toast.error('Error al guardar');
      }
    } catch (e) {
      toast.error('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
        <RefreshCw className="animate-spin mr-3" /> Cargando configuración...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Production Warning - Wompi Sandbox */}
        {process.env.NODE_ENV === 'production' && 
         config && 
         (typeof window !== 'undefined' && window.location.hostname !== 'localhost') && (
          <div className="mb-8 p-4 bg-yellow-900/30 border border-yellow-600 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-400">⚠️ Modo Sandbox Activo</p>
              <p className="text-sm text-yellow-300 mt-1">
                Wompi está configurado con llaves de <strong>pruebas (Sandbox)</strong>. 
                Los pagos no son reales. Cambia a llaves de producción (live) antes de lanzar a usuarios reales.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Configuración del Sistema</h1>
            <p className="text-zinc-400 mt-1">Ajustes globales de la plataforma OigaUsted</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Fees */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <DollarSign className="text-emerald-400" /> Comisiones y Pagos
            </h2>

            <div className="space-y-6">
              {/* Platform Commission */}
              <div>
                <Label className="text-sm text-zinc-400">Comisión de Plataforma</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    value={config.commissionRate}
                    onChange={(e) => updateField('commissionRate', parseFloat(e.target.value))}
                    className="w-28 bg-zinc-950 border-zinc-700 text-2xl font-bold"
                  />
                  <span className="text-2xl text-zinc-400">%</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Comisión que cobra OigaUsted sobre cada orden completada.
                </p>
                <div className="mt-2 text-[11px] bg-zinc-950 p-2 rounded-lg text-emerald-400">
                  Ejemplo: En un pedido de $100.000 → Plataforma gana ${(config.commissionRate * 100000).toFixed(0)}
                </div>
              </div>

              {/* Referral Commission */}
              <div>
                <Label className="text-sm text-zinc-400">Comisión por Referidos</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.3"
                    value={config.referralCommissionRate ?? 0.05}
                    onChange={(e) => updateField('referralCommissionRate', parseFloat(e.target.value))}
                    className="w-28 bg-zinc-950 border-zinc-700 text-2xl font-bold"
                  />
                  <span className="text-2xl text-zinc-400">%</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Porcentaje que se paga al usuario que refirió al vendedor/comprador.
                </p>
                <div className="mt-2 text-[11px] bg-zinc-950 p-2 rounded-lg text-amber-400">
                  Ejemplo: En un pedido de $100.000 → Referido gana ${(config.referralCommissionRate * 100000).toFixed(0)}
                </div>
              </div>

              <div>
                <Label className="text-sm text-zinc-400">Monto mínimo para retiro de vendedores</Label>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xl">$</span>
                  <Input
                    type="number"
                    value={config.minPayoutAmount}
                    onChange={(e) => updateField('minPayoutAmount', parseInt(e.target.value))}
                    className="bg-zinc-950 border-zinc-700 text-xl"
                  />
                  <span className="text-zinc-400">COP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Contact */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MessageCircle className="text-blue-400" /> Soporte y Contacto
            </h2>

            <div>
              <Label className="text-sm text-zinc-400">Email de soporte</Label>
              <Input
                type="email"
                value={config.supportEmail}
                onChange={(e) => updateField('supportEmail', e.target.value)}
                className="mt-2 bg-zinc-950 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">Se muestra en la página de soporte y correos automáticos.</p>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6">Funcionalidades</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Reseñas y Calificaciones</div>
                  <div className="text-sm text-zinc-400">Permitir que compradores dejen reseñas a vendedores</div>
                </div>
                <Switch
                  checked={config.enableReviews}
                  onCheckedChange={(checked) => updateField('enableReviews', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Chat en Órdenes</div>
                  <div className="text-sm text-zinc-400">Permitir mensajería entre comprador y vendedor dentro de una orden</div>
                </div>
                <Switch
                  checked={config.enableChat}
                  onCheckedChange={(checked) => updateField('enableChat', checked)}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-amber-400">
              <AlertTriangle /> Modo Mantenimiento
            </h2>

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center justify-between flex-1">
                <div>
                  <div className="font-medium">Activar Modo Mantenimiento</div>
                  <div className="text-sm text-zinc-400">
                    Muestra un banner en toda la plataforma y bloquea el acceso a usuarios normales.
                  </div>
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onCheckedChange={(checked) => updateField('maintenanceMode', checked)}
                />
              </div>

              <div className="flex-1">
                <Label className="text-sm text-zinc-400">Mensaje que verán los usuarios</Label>
                <Textarea
                  value={config.maintenanceMessage || ''}
                  onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                  className="mt-2 bg-zinc-950 border-zinc-700"
                  rows={2}
                />
              </div>
            </div>

            {config.maintenanceMode && (
              <div className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-2xl text-red-300 text-sm">
                <strong>¡Atención!</strong> El modo mantenimiento está activado. Los usuarios no administradores verán el banner de mantenimiento.
              </div>
            )}

            {/* Live Preview */}
            <div className="mt-6">
              <Label className="text-sm text-zinc-400 mb-2 block">Vista previa del banner</Label>
              <div className="bg-red-600 text-white px-4 py-3 text-center font-semibold flex items-center justify-center gap-3 text-sm rounded-xl">
                <AlertTriangle className="h-5 w-5" />
                <span>{config.maintenanceMessage || "Estamos realizando mejoras. Volveremos pronto."}</span>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Así se verá el banner para todos los usuarios cuando esté activado.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-zinc-500">
          Los cambios se aplican inmediatamente después de guardar. La tasa de comisión actual se usa en los reportes de ganancias de la plataforma.
        </div>
      </div>
    </div>
  );
}
