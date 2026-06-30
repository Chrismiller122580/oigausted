'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Save, RefreshCw, AlertTriangle, DollarSign, MessageCircle, Eye, EyeOff, Lock,
  CreditCard, Mail, Shield, Clock, RotateCcw, Check, ExternalLink, History, UserPlus, Upload, Globe, Key, Users
} from 'lucide-react';
import type { AdminSettingsFormConfig, AdminPlatformConfigResponse } from '@/types/platform-config';
import { asAuditDetails, type AuditLogEntry } from '@/types/audit';
import type { WompiTestSummary, WompiWebhookEvent } from '@/types/wompi';
import { BRAND_NAME, BRAND_LOGO_PATH } from '@/lib/brand';

// Enhanced accessible Switch using native input for reliable tap/keyboard behavior on all devices (incl. Android)
function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 focus-within:ring-offset-background touch-manipulation ${checked ? 'bg-orange-600' : 'bg-muted'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-background shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </label>
  );
}

interface PaymentStatus {
  wompi: {
    configured: boolean;
    mode: 'live' | 'sandbox' | 'missing';
    publicKeyPreview: string | null;
    hasIntegrityKey: boolean;
    hasEventsKey: boolean;
    hasPrivateKey?: boolean;
  };
  sftp?: {
    enabled?: boolean;
    configured?: boolean;
    host?: string | null;
  };
  resend?: {
    configured?: boolean;
    fromEmail?: string | null;
    fromMisconfigured?: boolean;
    hasWebhookSecret?: boolean;
  };
  appUrl: string | null;
}

type PlatformConfig = AdminSettingsFormConfig & {
  _meta?: {
    lastUpdated?: string;
    payment?: PaymentStatus;
    environment?: string;
  };
};

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

// Small widget to show recent PLATFORM_CONFIG_UPDATED events
function RecentConfigActivity() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit?limit=8');
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.logs || []).filter((l: AuditLogEntry) => l.action === 'PLATFORM_CONFIG_UPDATED');
        setLogs(filtered.slice(0, 5));
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (!logs.length && !loading) return null;

  return (
    <div className="mt-6 bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <History className="w-4 h-4" /> Recent configuration changes
        </div>
        <Link href="/admin/audit" className="text-xs text-orange-400 hover:underline flex items-center gap-1">
          Ver auditoría completa <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {loading && logs.length === 0 ? (
        <div className="text-xs text-muted-foreground">Loading history...</div>
      ) : (
        <div className="divide-y divide-border text-xs">
          {logs.length === 0 && <div className="py-2 text-muted-foreground">No configuration changes recorded yet.</div>}
          {logs.map((log, idx) => (
            <div key={idx} className="py-2 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-medium">{log.performedBy?.name || log.admin?.name || log.performedBy?.email || 'Admin'}</span>
                <span className="text-muted-foreground"> updated </span>
                <span className="font-mono text-[10px]">{(asAuditDetails(log.details)?.changedFields || []).join(', ') || 'config'}</span>
              </div>
              <div className="text-muted-foreground whitespace-nowrap shrink-0">
                {new Date(log.createdAt).toLocaleString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULTS: Partial<PlatformConfig> = {
  commissionRate: 0.12,
  referralCommissionRate: 0.05,
  minPayoutAmount: 50000,
  supportEmail: 'support@oigagig.com',
  supportPhone: '',
  enableReviews: true,
  enableChat: true,
  maintenanceMode: false,
  maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
  referralsEnabled: true,
  allowNewSignups: true,
  maxUploadSizeMB: 10,
  siteName: BRAND_NAME,
  siteTagline: 'Conecta con profesionales locales en Colombia',
  logoUrl: BRAND_LOGO_PATH,
  globalPushNotificationsEnabled: true,
  globalEmailNotificationsEnabled: true,
  maintenanceBypassIps: '',
  wompiRealPaymentsEnabled: false,
  wompiSftpEnabled: false,
  wompiSftpPort: 22,
  wompiSftpRemotePath: '/',
  tutorialsEnabled: true,
};

export default function AdminSettings() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Email testing state
  const [testEmailType, setTestEmailType] = useState<'welcome' | 'order' | 'review' | 'password-reset'>('welcome');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testHistory, setTestHistory] = useState<AuditLogEntry[]>([]);
  const [loadingTestHistory, setLoadingTestHistory] = useState(false);

  // Confirm save for risky actions
  const [pendingSaveConfirm, setPendingSaveConfirm] = useState<{
    reason: string;
    details: string;
  } | null>(null);

  // Recent Wompi-related audit logs for debugging
  const [recentWompiLogs, setRecentWompiLogs] = useState<AuditLogEntry[]>([]);

  // Wompi self-test (keys + live query capability)
  const [wompiTest, setWompiTest] = useState<WompiTestSummary | null>(null);
  const [wompiTestLoading, setWompiTestLoading] = useState(false);

  // Advanced real-event test for 401 signature debugging
  const [advancedEventJson, setAdvancedEventJson] = useState('');
  const [advancedTestEventsKey, setAdvancedTestEventsKey] = useState('');
  const [advancedReplay, setAdvancedReplay] = useState(true);
  const [advancedTestLoading, setAdvancedTestLoading] = useState(false);

  // === Tutorials + FAQ Management state (new admin tools) ===
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Simple inline new-FAQ form
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'general' });

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '', category: 'general' });

  // Admin password change state
  const [adminPasswordForm, setAdminPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);
  const [showAdminCurrent, setShowAdminCurrent] = useState(false);
  const [showAdminNew, setShowAdminNew] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);

  const isDirty = !!config && !!originalConfig && JSON.stringify({
    commissionRate: config.commissionRate,
    referralCommissionRate: config.referralCommissionRate,
    minPayoutAmount: config.minPayoutAmount,
    supportEmail: config.supportEmail,
    supportPhone: config.supportPhone || '',
    enableReviews: config.enableReviews,
    enableChat: config.enableChat,
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    referralsEnabled: config.referralsEnabled,
    allowNewSignups: config.allowNewSignups,
    maxUploadSizeMB: config.maxUploadSizeMB,
    siteName: config.siteName,
    siteTagline: config.siteTagline,
    logoUrl: config.logoUrl || '',
    globalPushNotificationsEnabled: config.globalPushNotificationsEnabled,
    globalEmailNotificationsEnabled: config.globalEmailNotificationsEnabled,
    maintenanceBypassIps: config.maintenanceBypassIps || '',
    wompiRealPaymentsEnabled: config.wompiRealPaymentsEnabled ?? false,
    // SFTP fields (were missing from dirty check — this was why Save stayed disabled)
    wompiSftpEnabled: config.wompiSftpEnabled ?? false,
    wompiSftpHost: config.wompiSftpHost || '',
    wompiSftpPort: config.wompiSftpPort || 22,
    wompiSftpUsername: config.wompiSftpUsername || '',
    wompiSftpPassword: config.wompiSftpPassword || '',
    wompiSftpPrivateKey: config.wompiSftpPrivateKey || '',
    wompiSftpRemotePath: config.wompiSftpRemotePath || '/',
    tutorialsEnabled: config.tutorialsEnabled ?? true,
  }) !== JSON.stringify({
    commissionRate: originalConfig.commissionRate,
    referralCommissionRate: originalConfig.referralCommissionRate,
    minPayoutAmount: originalConfig.minPayoutAmount,
    supportEmail: originalConfig.supportEmail,
    supportPhone: originalConfig.supportPhone || '',
    enableReviews: originalConfig.enableReviews,
    enableChat: originalConfig.enableChat,
    maintenanceMode: originalConfig.maintenanceMode,
    maintenanceMessage: originalConfig.maintenanceMessage,
    referralsEnabled: originalConfig.referralsEnabled,
    allowNewSignups: originalConfig.allowNewSignups,
    maxUploadSizeMB: originalConfig.maxUploadSizeMB,
    siteName: originalConfig.siteName,
    siteTagline: originalConfig.siteTagline,
    logoUrl: originalConfig.logoUrl || '',
    globalPushNotificationsEnabled: originalConfig.globalPushNotificationsEnabled,
    globalEmailNotificationsEnabled: originalConfig.globalEmailNotificationsEnabled,
    maintenanceBypassIps: originalConfig.maintenanceBypassIps || '',
    wompiRealPaymentsEnabled: originalConfig.wompiRealPaymentsEnabled ?? false,
    wompiSftpEnabled: originalConfig.wompiSftpEnabled ?? false,
    wompiSftpHost: originalConfig.wompiSftpHost || '',
    wompiSftpPort: originalConfig.wompiSftpPort || 22,
    wompiSftpUsername: originalConfig.wompiSftpUsername || '',
    wompiSftpPassword: originalConfig.wompiSftpPassword || '',
    wompiSftpPrivateKey: originalConfig.wompiSftpPrivateKey || '',
    wompiSftpRemotePath: originalConfig.wompiSftpRemotePath || '/',
    tutorialsEnabled: originalConfig.tutorialsEnabled ?? true,
  });

  const payment = config?._meta?.payment;
  const lastUpdated = config?._meta?.lastUpdated;

  // Normalize config for old rows that may be missing new fields (graceful upgrade)
  const normalizeConfig = (c: AdminPlatformConfigResponse): PlatformConfig => ({
    ...c,
    supportPhone: c.supportPhone ?? '',
    referralsEnabled: c.referralsEnabled ?? true,
    allowNewSignups: c.allowNewSignups ?? true,
    maxUploadSizeMB: c.maxUploadSizeMB ?? 10,
    siteName: c.siteName || BRAND_NAME,
    siteTagline: c.siteTagline || 'Conecta con profesionales locales en Colombia',
    logoUrl: c.logoUrl || null,
    globalPushNotificationsEnabled: c.globalPushNotificationsEnabled ?? true,
    globalEmailNotificationsEnabled: c.globalEmailNotificationsEnabled ?? true,
    maintenanceBypassIps: c.maintenanceBypassIps || '',
    wompiRealPaymentsEnabled: c.wompiRealPaymentsEnabled ?? false,
    wompiSftpEnabled: c.wompiSftpEnabled ?? false,
    wompiSftpHost: c.wompiSftpHost || '',
    wompiSftpPort: c.wompiSftpPort || 22,
    wompiSftpUsername: c.wompiSftpUsername || '',
    wompiSftpPasswordConfigured: c.wompiSftpPasswordConfigured ?? false,
    wompiSftpPrivateKeyConfigured: c.wompiSftpPrivateKeyConfigured ?? false,
    wompiSftpPassword: '',
    wompiSftpPrivateKey: '',
    wompiSftpRemotePath: c.wompiSftpRemotePath || '/',
    tutorialsEnabled: c.tutorialsEnabled ?? true,
  } as PlatformConfig);

  async function fetchConfig(fresh = false) {
    try {
      const url = fresh ? '/api/admin/config?fresh=1' : '/api/admin/config';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeConfig(data);
        setConfig(normalized);
        setOriginalConfig(JSON.parse(JSON.stringify(normalized))); // deep clone
        // Auto load Wompi logs when config loads
        loadWompiLogs();
        loadFaqs();
      } else {
        toast.error('Could not load configuration');
      }
    } catch (e) {
      toast.error('Error loading configuration');
    } finally {
      setLoading(false);
    }
  };

  async function loadWompiLogs() {
    try {
      const res = await fetch('/api/admin/audit?limit=30');
      if (res.ok) {
        const data = await res.json();
        const logs = (data.logs || []).filter((l: AuditLogEntry) =>
          (l.action && (l.action.includes('PAYMENT') || l.action.includes('WOMPI') || l.action.includes('ORDER') || l.action.includes('PLATFORM_CONFIG'))) ||
          l.targetType === 'Order' || l.targetType === 'PlatformConfig'
        ).slice(0, 15);
        setRecentWompiLogs(logs);
      }
    } catch (e) {
      // silent, button can retry
    }
  };

  useEffect(() => {
    fetchConfig();
    // Preload some test history for the tester panel
    loadTestHistory();
  }, []);

  const handleSave = async (force = false) => {
    if (!config) return;

    // Risk checks before saving
    if (!force) {
      const highCommission = (config.commissionRate || 0) > 0.25;
      const turningOnMaintenance = config.maintenanceMode && !originalConfig?.maintenanceMode;
      const zeroCommission = (config.commissionRate || 0) <= 0;

      if (highCommission) {
        setPendingSaveConfirm({
          reason: 'Very high commission',
          details: `The platform commission is at ${(config.commissionRate * 100).toFixed(0)}%. This is unusually high for most marketplaces. Do you confirm you want to save?`,
        });
        return;
      }
      if (turningOnMaintenance) {
        setPendingSaveConfirm({
          reason: 'Enabling Maintenance Mode',
          details: 'You are about to enable maintenance mode. All non-admin users will see the banner and will not be able to use normal functions. Continue?',
        });
        return;
      }
      if (zeroCommission) {
        setPendingSaveConfirm({
          reason: 'Commission at 0%',
          details: 'The platform commission is 0%. The platform will not generate revenue from orders. Are you sure?',
        });
        return;
      }
    }

    setPendingSaveConfirm(null);
    setSaving(true);

    try {
      // Only send the editable fields (avoid sending _meta back)
      const payload = {
        commissionRate: config.commissionRate,
        referralCommissionRate: config.referralCommissionRate,
        minPayoutAmount: config.minPayoutAmount,
        supportEmail: config.supportEmail,
        supportPhone: config.supportPhone || '',
        enableReviews: config.enableReviews,
        enableChat: config.enableChat,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
        referralsEnabled: config.referralsEnabled,
        allowNewSignups: config.allowNewSignups,
        maxUploadSizeMB: config.maxUploadSizeMB,
        siteName: config.siteName,
        siteTagline: config.siteTagline,
        logoUrl: config.logoUrl || null,
        globalPushNotificationsEnabled: config.globalPushNotificationsEnabled,
        globalEmailNotificationsEnabled: config.globalEmailNotificationsEnabled,
        maintenanceBypassIps: config.maintenanceBypassIps || '',
        wompiRealPaymentsEnabled: config.wompiRealPaymentsEnabled ?? false,
        // SFTP
        wompiSftpEnabled: config.wompiSftpEnabled ?? false,
        wompiSftpHost: config.wompiSftpHost || '',
        wompiSftpPort: config.wompiSftpPort || 22,
        wompiSftpUsername: config.wompiSftpUsername || '',
        wompiSftpPassword: config.wompiSftpPassword?.trim()
          ? config.wompiSftpPassword
          : (config.wompiSftpPasswordConfigured ? '__UNCHANGED__' : ''),
        wompiSftpPrivateKey: config.wompiSftpPrivateKey?.trim()
          ? config.wompiSftpPrivateKey
          : (config.wompiSftpPrivateKeyConfigured ? '__UNCHANGED__' : ''),
        wompiSftpRemotePath: config.wompiSftpRemotePath || '/',
        tutorialsEnabled: config.tutorialsEnabled ?? true,
      };

      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        toast.success('Configuration saved successfully');
        setLastSaved(new Date());
        // Use fresh fetch to bypass cache so saved value (maintenanceMode etc.) sticks immediately in the UI.
        await fetchConfig(true);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Error saving');
      }
    } catch (e) {
      toast.error('Network error saving');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      toast.info('Changes discarded');
    }
  };

  // ===== RESET TO DEFAULTS =====
  const applyDefaults = (partial: Partial<PlatformConfig> = DEFAULTS) => {
    if (!config) return;
    const next = { ...config, ...partial };
    setConfig(next);
    toast.success('Default values applied (remember to save)');
  };

  const resetAllToDefaults = () => {
    if (!config) return;
    const next = { ...config, ...DEFAULTS } as PlatformConfig;
    setConfig(next);
    toast('Configuration restored to defaults. Press Save to apply.');
  };

  async function loadTestHistory() {
    setLoadingTestHistory(true);
    try {
      const res = await fetch('/api/admin/audit?limit=20');
      if (res.ok) {
        const data = await res.json();
        const tests = (data.logs || []).filter((l: AuditLogEntry) => l.action === 'ADMIN_TEST_EMAIL_DIRECT' || l.action?.includes('TEST_EMAIL'));
        setTestHistory(tests.slice(0, 8));
      }
    } catch {}
    finally { setLoadingTestHistory(false); }
  };

  const resetSection = (section: 'fees' | 'features' | 'maintenance' | 'growth' | 'support' | 'branding' | 'notifications' | 'training') => {
    if (!config) return;
    let patch: Partial<PlatformConfig> = {};

    switch (section) {
      case 'fees':
        patch = { commissionRate: DEFAULTS.commissionRate!, referralCommissionRate: DEFAULTS.referralCommissionRate!, minPayoutAmount: DEFAULTS.minPayoutAmount! };
        break;
      case 'support':
        patch = { supportEmail: DEFAULTS.supportEmail!, supportPhone: DEFAULTS.supportPhone! };
        break;
      case 'features':
        patch = { enableReviews: DEFAULTS.enableReviews!, enableChat: DEFAULTS.enableChat! };
        break;
      case 'maintenance':
        patch = { maintenanceMode: DEFAULTS.maintenanceMode!, maintenanceMessage: DEFAULTS.maintenanceMessage! };
        break;
      case 'growth':
        patch = { referralsEnabled: DEFAULTS.referralsEnabled!, allowNewSignups: DEFAULTS.allowNewSignups!, maxUploadSizeMB: DEFAULTS.maxUploadSizeMB! };
        break;
      case 'branding':
        patch = { siteName: DEFAULTS.siteName!, siteTagline: DEFAULTS.siteTagline!, logoUrl: DEFAULTS.logoUrl! };
        break;
      case 'notifications':
        patch = { globalPushNotificationsEnabled: DEFAULTS.globalPushNotificationsEnabled!, globalEmailNotificationsEnabled: DEFAULTS.globalEmailNotificationsEnabled! };
        break;
      case 'training':
        patch = { tutorialsEnabled: DEFAULTS.tutorialsEnabled! };
        break;
    }
    setConfig({ ...config, ...patch });
    toast.info(`Section ${section} restored to defaults (save to apply)`);
  };

  // ========== FAQ + Tutorials helpers ==========
  async function loadFaqs() {
    setFaqsLoading(true);
    try {
      const res = await fetch('/api/admin/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } catch (e) {
      // silent for now
    } finally {
      setFaqsLoading(false);
    }
  };

  const toggleFaqActive = async (faq: FaqItem) => {
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
      });
      if (res.ok) {
        setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f));
        toast.success(faq.isActive ? 'FAQ desactivada' : 'FAQ activada');
      } else {
        toast.error('No se pudo cambiar el estado');
      }
    } catch {
      toast.error('Error al actualizar FAQ');
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('¿Eliminar esta FAQ permanentemente?')) return;
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFaqs(prev => prev.filter(f => f.id !== id));
        toast.success('FAQ eliminada');
      } else {
        toast.error('No se pudo eliminar');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const startEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setEditForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'general',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ question: '', answer: '', category: 'general' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          question: editForm.question,
          answer: editForm.answer,
          category: editForm.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs(prev => prev.map(f => f.id === editingId ? data.faq : f));
        toast.success('FAQ actualizada');
        cancelEdit();
      } else {
        toast.error('Error guardando cambios');
      }
    } catch {
      toast.error('Error de red');
    }
  };

  const createFaqFromForm = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Pregunta y respuesta son obligatorias');
      return;
    }
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newFaq.question.trim(),
          answer: newFaq.answer.trim(),
          category: newFaq.category || 'general',
          isActive: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs(prev => [data.faq, ...prev]);
        setNewFaq({ question: '', answer: '', category: 'general' });
        toast.success('FAQ creada');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'No se pudo crear la FAQ');
      }
    } catch {
      toast.error('Error creando FAQ');
    }
  };

  const generateFaqWithAI = async () => {
    if (!aiTopic.trim()) {
      toast.error('Escribe un tema o idea para la FAQ (ej: "Pagos con Nequi" o "Cancelar pedido")');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiTopic.trim(),
          category: 'Soporte y Ayuda',
          type: 'faq',
        }),
      });
      const data = await res.json();
      if (data.question && data.answer) {
        setNewFaq({
          question: data.question,
          answer: data.answer,
          category: 'soporte',
        });
        toast.success('FAQ sugerida por IA. Revisa y pulsa "Agregar FAQ".');
        setAiTopic('');
      } else {
        toast.error(data.error || 'La IA no devolvió una FAQ estructurada. Intenta de nuevo o edita manualmente.');
      }
    } catch (e) {
      toast.error('Error llamando a la IA para generar FAQ');
    } finally {
      setGeneratingAi(false);
    }
  };

  const loadDefaultFaqs = async () => {
    const defaults = [
      { question: '¿Cómo pago con Nequi o PayU?', answer: 'En la página de checkout selecciona Nequi (recomendado para pagos instantáneos), PSE o PayU. El dinero se retiene seguro y se libera al vendedor solo cuando marques el pedido como completado.', category: 'pagos' },
      { question: '¿Cómo contacto al vendedor?', answer: 'Usa el botón "Contactar" en el gig o en la página del pedido. Abre WhatsApp directo con el número del vendedor. También hay chat interno en /orders/[id].', category: 'general' },
      { question: '¿Puedo cancelar un pedido?', answer: 'Solo los compradores pueden cancelar pedidos en estado "Pending" o "Paid". Los vendedores pueden actualizar a "In Progress" o "Completed". Una vez en progreso o completado no se puede cancelar unilateralmente.', category: 'pedidos' },
      { question: '¿Cómo me convierto en vendedor?', answer: 'Ve a tu Perfil → "Convertirme en Vendedor", completa el nombre del negocio y confirma. Luego ve al Dashboard de Vendedor para crear tu primer gig y configurar tu perfil público.', category: 'vendedores' },
      { question: '¿Dónde está mi perfil público?', answer: 'Para vendedores: /sellers/[tu-slug]. Compártelo en redes, WhatsApp o tarjetas. Los clientes pueden contactarte directamente sin pasar por el dashboard.', category: 'vendedores' },
      { question: '¿Cómo funcionan las reseñas y reputación?', answer: 'Después de un pedido completado, el comprador puede dejar una reseña de 1-5 estrellas + comentario. Las reseñas aparecen en tu perfil público y ayudan a generar confianza (y más pedidos).', category: 'general' },
    ];
    let created = 0;
    for (const d of defaults) {
      try {
        const res = await fetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...d, isActive: true }),
        });
        if (res.ok) {
          const data = await res.json();
          setFaqs(prev => [data.faq, ...prev.filter(p => p.question !== d.question)]);
          created++;
        }
      } catch {}
    }
    toast.success(`Cargadas ${created} FAQs por defecto`);
  };

  const updateField = (field: keyof PlatformConfig, value: PlatformConfig[keyof PlatformConfig]) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  // Quick preset helpers
  const setCommissionPreset = (rate: number) => updateField('commissionRate', rate);
  const setReferralPreset = (rate: number) => updateField('referralCommissionRate', rate);

  // Email test handler (uses existing /api/test-email)
  const handleSendTestEmail = async () => {
    setTestEmailSending(true);
    try {
      const body: { emailType: typeof testEmailType; to?: string } = { emailType: testEmailType };
      if (testEmailTo.trim()) body.to = testEmailTo.trim();

      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Test email sent');
        if (data.to) setTestEmailTo('');
        // Refresh history after successful send
        loadTestHistory();
      } else {
        toast.error(data.error || 'Could not send test email');
      }
    } catch (e) {
      toast.error('Error sending test email');
    } finally {
      setTestEmailSending(false);
    }
  };

  // Admin password change handler
  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminPasswordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setAdminPasswordLoading(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: adminPasswordForm.currentPassword || undefined,
          newPassword: adminPasswordForm.newPassword,
          confirmPassword: adminPasswordForm.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Administrator password updated successfully');
        setAdminPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Could not change password');
      }
    } catch (err) {
      toast.error('Error changing password');
    } finally {
      setAdminPasswordLoading(false);
    }
  };

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);

  if (loading || !config) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
        <RefreshCw className="animate-spin mr-3" /> Loading configuration...
      </div>
    );
  }

  const wompi = payment?.wompi;
  const isSandbox = wompi?.mode === 'sandbox' || (!wompi?.configured && process.env.NODE_ENV === 'production');

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-6xl mx-auto">

        {/* Top status bar - mobile friendly */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Central platform control • Changes apply immediately after saving</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {isDirty && (
              <div className="flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Unsaved changes
              </div>
            )}
            {lastSaved && !isDirty && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Saved {lastSaved.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {lastUpdated && !isDirty && (
              <div className="text-[10px] text-muted-foreground/70 hidden md:block">
                Last server update: {new Date(lastUpdated).toLocaleString('es-CO')}
              </div>
            )}

            {isDirty && (
              <Button variant="outline" onClick={discardChanges} disabled={saving} size="sm" className="min-h-[36px]">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Discard
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={resetAllToDefaults}
              disabled={saving}
              title="Restaurar todos los valores por defecto (requiere guardar)"
              size="sm"
              className="min-h-[36px]"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset defaults
            </Button>
            <Button 
              onClick={() => handleSave()} 
              disabled={saving || !isDirty} 
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 min-h-[36px]"
              size="sm"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Strong Payment / Sandbox Warning - now data driven */}
        {(!config?.wompiRealPaymentsEnabled || isSandbox || (wompi && wompi.mode !== 'live')) && (
          <div className="mb-8 p-4 bg-yellow-900/30 border border-yellow-600/70 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-400">⚠️ Real Wompi payments are DISABLED or in test mode</p>
              <p className="text-yellow-300 mt-1">
                {config?.wompiRealPaymentsEnabled 
                  ? "Payments processed currently are test/sandbox payments. Users will not be charged real money."
                  : "The admin has turned off real payments (even if live keys are configured). No real charges will occur."}
                {wompi?.publicKeyPreview && <> Public key: <code className="font-mono bg-black/30 px-1 rounded">{wompi.publicKeyPreview}</code></>}
              </p>
              <p className="text-yellow-300/80 text-xs mt-1">
                Use the toggle inside the Wompi card below + live keys (pub_live_...) in env to accept real payments.
              </p>
            </div>
          </div>
        )}

        {/* Unsaved banner (prominent when dirty) */}
        {isDirty && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-2 text-sm flex items-center gap-2 text-amber-400">
            You have unsaved changes. Settings will not take effect until you click "Save Changes".
          </div>
        )}

        {/* ========== NEW: Tutorials + FAQ Management Tools ========== */}
        <div className="mb-8 bg-card border border-border rounded-3xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                🎓
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Capacitación de Usuarios, Tutoriales y FAQ</h2>
                <p className="text-sm text-muted-foreground">Control global de los tutoriales interactivos + lista de FAQs editables con creación por IA. Los cambios en FAQs aparecen inmediatamente en /support.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadFaqs} disabled={faqsLoading}>
              <RefreshCw className="w-4 h-4 mr-1" /> Recargar FAQs
            </Button>
          </div>

          {/* Tutorials Master Toggle */}
          <div className="mb-8 p-5 border border-orange-200/60 dark:border-orange-900/40 rounded-2xl bg-orange-50/30 dark:bg-orange-950/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Habilitar Tutoriales y Capacitación
                  {config?.tutorialsEnabled ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">ACTIVO</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600">DESACTIVADO</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-prose">
                  Interruptor maestro. Cuando está apagado, los tutoriales automáticos (nuevos compradores, nuevos vendedores y al convertirse de buyer → seller) no se muestran. Los botones manuales en /support también se pueden ocultar. Úsalo para pausas de entrenamiento o lanzamientos graduales.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resetSection('training')}>Restaurar default</Button>
                  <Button size="sm" variant="outline" onClick={() => updateField('tutorialsEnabled', true)}>Activar ahora</Button>
                  <Button size="sm" variant="outline" onClick={() => updateField('tutorialsEnabled', false)}>Desactivar ahora</Button>
                </div>
              </div>
              <Switch
                checked={!!config?.tutorialsEnabled}
                onCheckedChange={(v) => updateField('tutorialsEnabled', v)}
              />
            </div>
          </div>

          {/* FAQ Management */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Lista de FAQs (activa / inactiva)</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={loadDefaultFaqs} disabled={faqsLoading}>
                  Cargar FAQs por defecto
                </Button>
              </div>
            </div>

            {/* AI Generator Tool */}
            <div className="mb-4 p-4 border rounded-2xl bg-background">
              <div className="text-sm font-medium mb-2">Crear FAQ con IA (Grok)</div>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder='Tema o idea (ej: "Cómo cancelar un pedido", "Nequi no funciona", "Ver mi perfil público")'
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !generatingAi) generateFaqWithAI(); }}
                />
                <Button onClick={generateFaqWithAI} disabled={generatingAi || !aiTopic.trim()} className="whitespace-nowrap">
                  {generatingAi ? 'Generando con Grok...' : '✨ Generar con IA'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">La IA sugiere pregunta + respuesta. Se precarga en el formulario de "Nueva FAQ" para que la revises y guardes.</p>
            </div>

            {/* Current FAQs list */}
            <div className="border rounded-2xl overflow-hidden mb-4">
              {faqsLoading && faqs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Cargando FAQs...</div>
              ) : faqs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Aún no hay FAQs. Usa el generador de IA arriba o el botón "Cargar FAQs por defecto".
                </div>
              ) : (
                <div className="divide-y">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="p-4 flex flex-col md:flex-row md:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {editingId === faq.id ? (
                          <div className="space-y-2">
                            <Input value={editForm.question} onChange={(e) => setEditForm({ ...editForm, question: e.target.value })} placeholder="Pregunta" />
                            <Textarea value={editForm.answer} onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })} rows={3} placeholder="Respuesta" />
                            <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="Categoría (general, pagos, vendedores...)" />
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-foreground">{faq.question}</div>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{faq.answer}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">Categoría: {faq.category || 'general'} • {faq.isActive ? 'Visible en /support' : 'Oculta'}</div>
                          </>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2 items-start md:items-end shrink-0">
                        {editingId === faq.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>Guardar</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancelar</Button>
                          </>
                        ) : (
                          <>
                            <Switch checked={faq.isActive} onCheckedChange={() => toggleFaqActive(faq)} />
                            <Button size="sm" variant="outline" onClick={() => startEdit(faq)}>Editar</Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteFaq(faq.id)}>Eliminar</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new FAQ form */}
            <div className="border rounded-2xl p-4 bg-background">
              <div className="font-medium mb-2 text-sm">Agregar nueva FAQ manualmente</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Pregunta (ej: ¿Cómo dejo una reseña?)"
                />
                <Input
                  value={newFaq.category}
                  onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                  placeholder="Categoría (pagos, pedidos, vendedores, general)"
                />
              </div>
              <Textarea
                className="mt-2"
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                rows={3}
                placeholder="Respuesta clara y útil..."
              />
              <div className="mt-3">
                <Button onClick={createFaqFromForm} disabled={!newFaq.question.trim() || !newFaq.answer.trim()}>
                  Agregar FAQ
                </Button>
                <span className="ml-3 text-xs text-muted-foreground">Se crea como activa y visible inmediatamente en la página de soporte de usuarios.</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4">Nota: El estado de "visto el tutorial" de cada usuario se guarda en su navegador (localStorage). El interruptor global previene que aparezcan automáticamente. Para forzar re-mostrar, el usuario puede borrar caché o el admin puede desactivar/reactivar el toggle.</p>
        </div>

        {/* === NEW: Payment Gateway Status (Wompi) === */}
        <div className="mb-6 bg-card border border-border rounded-3xl p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Payment Gateway — Wompi</h2>
                <p className="text-sm text-muted-foreground">Integration status and keys (secrets not exposed)</p>
              </div>
            </div>
            {wompi && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${wompi.mode === 'live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : wompi.mode === 'sandbox' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                {wompi.mode === 'live' ? 'LIVE — Real payments' : wompi.mode === 'sandbox' ? 'SANDBOX — Test' : 'NOT CONFIGURED'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs mb-1">Public Key</div>
              <div className="font-mono text-xs break-all">{wompi?.publicKeyPreview || 'No configurada (NEXT_PUBLIC_WOMPI_PUBLIC_KEY)'}</div>
              <div className={`mt-2 text-[10px] ${wompi?.configured ? 'text-emerald-400' : 'text-red-400'}`}>
                {wompi?.configured ? 'Configured' : 'Missing in environment variables'}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs mb-1">Detected mode</div>
              <div className="font-semibold text-lg">{wompi?.mode?.toUpperCase() || 'DESCONOCIDO'}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Based on the public key prefix
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs mb-1">Integrity Key</div>
              <div className={wompi?.hasIntegrityKey ? 'text-emerald-400' : 'text-red-400'}>
                {wompi?.hasIntegrityKey ? '✓ Presente (WOMPI_INTEGRITY_KEY)' : '✕ Faltante'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">Requerida para firmar el checkout</div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs mb-1">Webhook Events Key</div>
              <div className={wompi?.hasEventsKey ? 'text-emerald-400' : 'text-amber-400'}>
                {wompi?.hasEventsKey ? '✓ Presente' : '⚠ No detectada (opcional pero recomendada)'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">Usada para validar webhooks entrantes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs mb-1">Private Key (API)</div>
              <div className={payment?.wompi?.hasPrivateKey ? 'text-emerald-400' : 'text-amber-400'}>
                {payment?.wompi?.hasPrivateKey ? '✓ Presente (WOMPI_PRIVATE_KEY)' : 'Opcional (para API de pagos a terceros)'}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-muted-foreground text-xs mb-1">SFTP Reports</div>
              <div className={payment?.sftp?.configured ? 'text-emerald-400' : payment?.sftp?.enabled ? 'text-yellow-400' : 'text-muted-foreground'}>
                {payment?.sftp?.configured ? '✓ Configurado' : payment?.sftp?.enabled ? 'Activado (credenciales incompletas)' : 'Desactivado'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{payment?.sftp?.host || 'No host'}</div>
            </div>
            {config.maintenanceMode && (
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="text-muted-foreground text-xs mb-1">Support Tools (Maintenance Mode only)</div>
                <div className="text-[10px] space-y-1">
                  <Link href="/admin/payouts" className="text-orange-400 hover:underline block">→ Payouts Debugger (local marks + force check)</Link>
                  <Link href="/admin/audit?action=PAYMENT" className="text-orange-400 hover:underline block">→ Recent Payment Audit Logs</Link>
                  <span className="text-muted-foreground">Webhook: https://oigagig.com/api/webhooks/wompi</span> (direct GET returns status info; only POSTs from Wompi are processed)
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
            <span>Configura las variables en Vercel / .env para producción:</span>
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">NEXT_PUBLIC_WOMPI_PUBLIC_KEY</code>
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">WOMPI_INTEGRITY_KEY</code>
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">WOMPI_EVENTS_KEY</code>
          </div>

          {/* Wompi connectivity + key self-test (uses the new /api/admin/wompi/test) */}
          <div className="mt-3 p-3 border border-border rounded-xl bg-background">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-sm font-medium">Probar llaves y conexión Wompi</div>
              <Button
                size="sm"
                variant="outline"
                disabled={wompiTestLoading}
                onClick={async () => {
                  setWompiTestLoading(true);
                  try {
                    const res = await fetch('/api/admin/wompi/test', { method: 'POST' });
                    const data = await res.json();
                    setWompiTest(data?.summary || data);
                    if (data?.success === false) toast.error(data.error || 'Test falló');
                  } catch {
                    toast.error('No se pudo ejecutar el test de Wompi');
                  } finally {
                    setWompiTestLoading(false);
                  }
                }}
              >
                {wompiTestLoading ? 'Probando...' : 'Ejecutar test de conexión'}
              </Button>
            </div>
            {wompiTest && (
              <div className="text-[10px] font-mono bg-muted/60 p-2 rounded overflow-auto max-h-48">
                <div>Pub: {wompiTest.publicKeyPrefix} | Integ: {wompiTest.integrityKeyPrefix} | Events: {wompiTest.eventsKeyPrefix} | Priv: {wompiTest.privateKeyPrefix}</div>
                <div>Env: pub={wompiTest.environments?.public} integ={wompiTest.environments?.integrity} events={wompiTest.environments?.events} priv={wompiTest.environments?.private}</div>
                {wompiTest.integrityPubMismatch && <div className="text-red-600 font-bold">⚠️ MISMATCH pub vs integrity (causa principal de "firma inválida")</div>}
                {wompiTest.sampleSignature && <div>Sample sig OK: {wompiTest.sampleSignature} ({wompiTest.sampleSignatureNote})</div>}
                {wompiTest.sampleEventsSignature && <div>Events sample sig OK: {wompiTest.sampleEventsSignature} ({wompiTest.sampleEventsSignatureNote})</div>}
                {wompiTest.query && (
                  <div>Query: ok={String(wompiTest.query.ok)} status={wompiTest.query.status} usedPrivate={String(wompiTest.query.usedPrivate)} {wompiTest.query.error ? 'err=' + String(wompiTest.query.error).slice(0,80) : ''}</div>
                )}
                {wompiTest.eventVerification?.attempted && (
                  <div>Event verification: matches={String(wompiTest.eventVerification.matches)} payload={wompiTest.eventVerification.signedPayload} reason={wompiTest.eventVerification.reason}</div>
                )}
                {wompiTest.replayResult?.attempted && (
                  <div>Replay: {wompiTest.replayResult.success ? 'SUCCESS' : 'FAILED'} action={wompiTest.replayResult.action} order={wompiTest.replayResult.orderId} status={wompiTest.replayResult.status}</div>
                )}
                {(wompiTest.recommendations?.length ?? 0) > 0 && (
                  <div className="mt-1 text-amber-600">Recomendaciones: {wompiTest.recommendations!.join(' • ')}</div>
                )}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mt-1">Ejecuta esto después de rotar llaves o para validar que el PRIVATE key puede leer transacciones.</div>

            {/* Advanced real event tester - for the 401 "Invalid signature" cases */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-sm font-medium mb-1">Probar evento real de Wompi (debug firma inválida / 401)</div>
              <div className="text-[10px] text-muted-foreground mb-2">
                1. Ve a <a href="https://comercios.wompi.co/debugger" target="_blank" className="underline">Wompi Debugger</a> o "Seguimiento de transacciones" en tu cuenta Wompi.<br/>
                2. Copia SOLO el objeto JSON completo del "Evento" (empieza con <code className="font-mono">{'{"data":{...}}'}</code>, termina con el {'}'} final del evento).<br/>
                3. (Opcional) Pégalo primero en <a href="https://jsonlint.com" target="_blank" className="underline">jsonlint.com</a> para validar que sea JSON limpio.<br/>
                4. Pégalo aquí abajo. Usa "testEventsKey" con un candidato de "Eventos" del dashboard de Wompi para esta llave pública. Marca "Replay" si quieres procesar la orden.<br/>
                Ver docs oficiales: <a href="https://docs.wompi.co/docs/colombia/inicio-rapido/" target="_blank" className="underline">https://docs.wompi.co/docs/colombia/inicio-rapido/</a> y https://docs.wompi.co/docs/colombia/eventos/ para el método exacto de concatenación de propiedades y el "secreto de eventos".
              </div>

              <div className="flex gap-2 mb-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const raw = advancedEventJson;
                    const match = raw.match(/\{[\s\S]*\}$/);
                    if (match) {
                      try {
                        // Validate it parses
                        JSON.parse(match[0]);
                        setAdvancedEventJson(match[0]);
                        toast.success('JSON extraído y limpiado. Listo para probar.');
                      } catch {
                        toast.error('No se pudo extraer un JSON válido del texto pegado.');
                      }
                    } else {
                      toast.error('No se encontró un objeto JSON ( { ... } ) en el texto.');
                    }
                  }}
                >
                  Limpiar / Extraer solo el JSON
                </Button>
                <div className="text-[10px] text-muted-foreground self-center">Úsalo si pegaste texto extra del debugger (incluyendo "Evento" o "Headers").</div>
              </div>

              <textarea
                value={advancedEventJson}
                onChange={(e) => setAdvancedEventJson(e.target.value)}
                placeholder={`Pega SOLO el JSON del evento aquí (sin "Evento", sin "Headers del evento", sin texto extra):\n\n{\n  "data": {\n    "transaction": {\n      "id": "1411569-...",\n      "status": "ERROR",\n      ...\n    }\n  },\n  "event": "transaction.updated",\n  "signature": {\n    "checksum": "...",\n    "properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"]\n  },\n  ...\n}`}
                className="w-full text-xs font-mono border rounded p-2 h-40 bg-background"
              />

              <div className="flex gap-2 mt-2 items-end">
                <div className="flex-1">
                  <div className="text-[10px] mb-0.5">testEventsKey (opcional - candidato "Llave para eventos")</div>
                  <input
                    type="text"
                    value={advancedTestEventsKey}
                    onChange={(e) => setAdvancedTestEventsKey(e.target.value)}
                    placeholder="prod_events_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full text-xs font-mono border rounded px-2 py-1 bg-background"
                  />
                </div>
                <label className="flex items-center gap-1 text-xs pb-1">
                  <input type="checkbox" checked={advancedReplay} onChange={e => setAdvancedReplay(e.target.checked)} />
                  Replay
                </label>
                <Button
                  size="sm"
                  variant="default"
                  disabled={advancedTestLoading || !advancedEventJson.trim()}
                  onClick={async () => {
                    setAdvancedTestLoading(true);
                    try {
                      let sampleEvent: WompiWebhookEvent;
                      const raw = advancedEventJson.trim();

                      // Try direct parse first
                      try {
                        sampleEvent = JSON.parse(raw);
                      } catch {
                        // Try to extract the outermost JSON object (common when copying from Wompi debugger page)
                        const match = raw.match(/\{[\s\S]*\}$/);
                        if (match) {
                          try {
                            sampleEvent = JSON.parse(match[0]);
                          } catch {
                            toast.error('JSON inválido del evento. Usa el botón "Limpiar / Extraer solo el JSON" arriba, o copia solo el objeto que empieza con { "data": ... } (sin "Evento" ni "Headers").');
                            return;
                          }
                        } else {
                          toast.error('JSON inválido del evento. Usa el botón "Limpiar / Extraer solo el JSON" arriba, o copia solo el objeto que empieza con { "data": ... } (sin "Evento" ni "Headers").');
                          return;
                        }
                      }
                      const body: { sampleEvent: WompiWebhookEvent; replay: boolean; testEventsKey?: string } = { sampleEvent, replay: advancedReplay };
                      if (advancedTestEventsKey.trim()) body.testEventsKey = advancedTestEventsKey.trim();
                      const res = await fetch('/api/admin/wompi/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                      });
                      const data = await res.json();
                      setWompiTest(data?.summary || data);
                      if (data?.success === false) toast.error(data.error || 'Test falló');
                      else toast.success('Test de evento real completado - revisa eventVerification abajo');
                    } catch {
                      toast.error('Error ejecutando test avanzado');
                    } finally {
                      setAdvancedTestLoading(false);
                    }
                  }}
                >
                  {advancedTestLoading ? 'Probando...' : 'Probar evento real'}
                </Button>
              </div>

              <div className="text-[10px] text-amber-600 mt-1">
                Pega un "Evento" real de Wompi (el que da 401). Si ves "JSON inválido", usa el botón "Limpiar / Extraer solo el JSON" de arriba. Copia SOLO desde el primer {'{'} hasta el último {'}'} del evento.
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-muted/50 rounded-xl text-xs">
            <div className="font-medium mb-1">Cómo ver transacciones en Wompi</div>
            <div>
              La integración usa el <strong>Widget embebido</strong> (no "Links de Pago" – los links son otro flujo para crear URLs de pago).
              Las transacciones del widget aparecen en:
              <ul className="list-disc ml-4 mt-1">
                <li>Dashboard Wompi → <strong>Transacciones</strong> (o el buscador)</li>
                <li>Directamente en el <a href="https://comercios.wompi.co/debugger" target="_blank" className="text-orange-600 hover:underline">Debugger de Wompi</a> (el link que pegaste). Busca por el <code>reference</code> exacto que muestra el debugger de la app (ej: <code>order_1021bb6a-...</code> o <code>order_0b4bb7de-...</code>).</li>
              </ul>
              <strong>Por qué no ves nada aún:</strong>
              <ul className="list-disc ml-4 mt-1">
                <li>El "prepare" (el JSON del debugger) solo genera la config firmada. La transacción real se crea cuando el usuario completa el pago en el modal de Wompi.</li>
                <li>Si ves el toast "El sistema de pagos aún está cargando", el widget.js no cargó todavía (el botón "Launch Wompi to Enter Payment" ahora intenta cargarlo on-demand).</li>
                <li>Asegúrate de usar llaves PROD + toggle "Enable Real Payments" ON en esta página, y de mirar el ambiente correcto en Wompi (test vs prod).</li>
                <li>Las 500s de los logs son por drift de DB (columna sellerPayoutAt faltante en payouts marking) – no afectan las transacciones de Wompi. Se manejan con fallback local.</li>
              </ul>
              Usa el reference del debugger de la app + el link de Wompi Debugger para verificar.
            </div>
          </div>

          {/* === Smart Wompi Setup Checklist (no-bypass real flow) === */}
          <div className="mt-6 border-t pt-5">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2">
              ✅ Checklist para flujo real de Wompi (Smart Checkout)
            </div>
            <ol className="text-xs space-y-1.5 text-muted-foreground list-decimal list-inside">
              <li>Usa llaves <strong>LIVE</strong> (pub_live_...) en <code>NEXT_PUBLIC_WOMPI_PUBLIC_KEY</code> (no test_)</li>
              <li>Agrega <code>WOMPI_INTEGRITY_KEY</code> (para firmar el widget de forma segura)</li>
              <li>Add <code>WOMPI_EVENTS_KEY</code> and register the webhook in the Wompi dashboard: <code>https://oigagig.com/api/webhooks/wompi</code> (the endpoint returns friendly info on GET; only processes signed POSTs)</li>
              <li>En esta página, activa el toggle <strong>"Pagos reales con Wompi"</strong> de arriba</li>
              <li>El checkout en /checkout/[gigId] guardará campos dinámicos + ubicación antes de abrir Wompi</li>
              <li>La confirmación real llega solo por webhook (no por redirect del cliente)</li>
              <li>En producción: desactiva el botón de simulación (solo visible en dev)</li>
              <li>(Opcional para reconciliación) Configura SFTP en la sección de abajo y usa Sync para reports de settlement/payouts</li>
            </ol>
            <p className="text-[10px] text-emerald-400 mt-2">
              Con todo esto activado, el flujo completo (campos inteligentes + precio final + Wompi widget + webhook) funciona sin bypass.
            </p>
          </div>

          {/* === Real Payments Master Toggle (the key admin tool) === */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium flex items-center gap-2">
                  Enable Real Payments
                  {config?.wompiRealPaymentsEnabled ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">LIVE ENABLED</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400">TEST MODE (SAFE)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Master switch. Even with LIVE keys configured in the environment, turning this off prevents any real charges from being processed. Use during testing or rollout.
                </p>
              </div>
              <Switch 
                checked={!!config?.wompiRealPaymentsEnabled} 
                onCheckedChange={(v) => updateField('wompiRealPaymentsEnabled', v)} 
              />
            </div>
          </div>
        </div>

        {/* Wompi SFTP/FTPS Configuration (for reports, settlements, automatic reconciliation) */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold">Wompi SFTP/FTPS (Reports &amp; Settlements)</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Optional</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect to Wompi&apos;s SFTP/FTPS to automatically download settlement reports, transaction files and payout confirmations. 
            Use this to reconcile the admin payouts page and mark seller transfers when Wompi actually settles the funds.
            Configure the connection details you receive from Wompi dashboard (Developers → Integrations → SFTP/FTPS).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Enabled</label>
              <Switch 
                checked={!!config?.wompiSftpEnabled} 
                onCheckedChange={(v) => updateField('wompiSftpEnabled', v)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Host</label>
              <input 
                value={config?.wompiSftpHost || ''} 
                onChange={(e) => updateField('wompiSftpHost', e.target.value)} 
                placeholder="sftp.wompi.co or your provided host"
                className="w-full border rounded-xl px-3 py-2 bg-background" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Port</label>
              <input 
                type="number" 
                value={config?.wompiSftpPort || 22} 
                onChange={(e) => updateField('wompiSftpPort', parseInt(e.target.value) || 22)} 
                className="w-full border rounded-xl px-3 py-2 bg-background" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Username</label>
              <input 
                value={config?.wompiSftpUsername || ''} 
                onChange={(e) => updateField('wompiSftpUsername', e.target.value)} 
                placeholder="your-wompi-username"
                className="w-full border rounded-xl px-3 py-2 bg-background" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password (if using password auth)</label>
              <input 
                type="password" 
                value={config?.wompiSftpPassword || ''} 
                onChange={(e) => updateField('wompiSftpPassword', e.target.value)} 
                placeholder={config?.wompiSftpPasswordConfigured ? 'Configured — leave blank to keep current password' : 'Leave blank if using private key'}
                className="w-full border rounded-xl px-3 py-2 bg-background" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Private Key (if using key auth, paste full key)</label>
              <textarea 
                value={config?.wompiSftpPrivateKey || ''} 
                onChange={(e) => updateField('wompiSftpPrivateKey', e.target.value)} 
                placeholder={config?.wompiSftpPrivateKeyConfigured ? 'Configured — leave blank to keep current private key' : 'Paste the COMPLETE private key text here (including BEGIN/END lines)'}
                rows={6}
                className="w-full border rounded-xl px-3 py-2 bg-background font-mono text-xs" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Remote Path (base directory on SFTP)</label>
              <input 
                value={config?.wompiSftpRemotePath || '/'} 
                onChange={(e) => updateField('wompiSftpRemotePath', e.target.value)} 
                placeholder="/reports or /settlements"
                className="w-full border rounded-xl px-3 py-2 bg-background" 
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/wompi/sftp/test', { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({
                      host: config?.wompiSftpHost,
                      port: config?.wompiSftpPort,
                      username: config?.wompiSftpUsername,
                      password: config?.wompiSftpPassword?.trim()
                        ? config.wompiSftpPassword
                        : (config?.wompiSftpPasswordConfigured ? '__UNCHANGED__' : ''),
                      privateKey: config?.wompiSftpPrivateKey?.trim()
                        ? config.wompiSftpPrivateKey
                        : (config?.wompiSftpPrivateKeyConfigured ? '__UNCHANGED__' : ''),
                      remotePath: config?.wompiSftpRemotePath,
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success(data.message);
                    if (data.files?.length) toast.info(`Sample files: ${data.files.join(', ')}`);
                  } else {
                    toast.error(data.message || 'Test failed');
                  }
                } catch (e) {
                  toast.error('Test connection failed');
                }
              }}
              variant="outline"
            >
              Test Connection (uses current form values)
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/wompi/sftp/sync', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    toast.success(data.message);
                  } else {
                    toast.error(data.message || 'Sync failed');
                  }
                } catch {
                  toast.error('Sync failed');
                }
              }}
              variant="outline"
            >
              Sync Latest Reports Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            After saving, use &quot;Test Connection&quot; with the values from your Wompi SFTP setup. 
            &quot;Sync&quot; will download recent settlement/report files and log them (extend parser in lib/wompi-sftp.ts for auto-updating payouts).
          </p>
        </div>

        {/* Wompi Logs / Recent Events for debugging on settings page - only in maintenance mode */}
        {config.maintenanceMode && (
        <div className="mb-6 bg-card border border-border rounded-3xl p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="w-5 h-5" /> Wompi Recent Logs &amp; Events
              </h2>
              <p className="text-sm text-muted-foreground">Audit logs for payments, config changes, orders (last 15 matching)</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadWompiLogs}>
              Refresh Logs
            </Button>
          </div>
          {recentWompiLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent Wompi-related logs yet. Perform a payment or config save to see entries.</p>
          ) : (
            <div className="divide-y divide-border text-xs max-h-64 overflow-auto">
              {recentWompiLogs.map((log, idx: number) => (
                <div key={idx} className="py-2 flex justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground"> • {log.targetType} {log.targetId ? log.targetId.slice(0,8) : ''}</span>
                    {log.details && <div className="text-muted-foreground truncate">{JSON.stringify(log.details).slice(0,100)}</div>}
                  </div>
                  <div className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">See full history in <Link href="/admin/audit" className="text-orange-400 hover:underline">/admin/audit</Link></p>
        </div>
        )}

        {/* === NEW: Integrations & Environment Status === */}
        <div className="mb-6 bg-card border border-border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="text-sky-400" />
            <h2 className="text-xl font-semibold">Integrations & Environment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Mail className="w-3.5 h-3.5" /> Resend (Emails)
              </div>
              {config._meta?.payment?.resend?.fromMisconfigured ? (
                <div className="text-red-400 text-sm">⚠ RESEND_FROM_EMAIL inválido (parece API key)</div>
              ) : config._meta?.payment?.resend?.configured ? (
                <div className="text-emerald-400 text-sm">✓ Configurado</div>
              ) : (
                <div className="text-amber-400 text-sm">⚠ Falta RESEND_API_KEY</div>
              )}
              <div className="text-[10px] text-muted-foreground mt-1">
                From: {config._meta?.payment?.resend?.fromEmail || 'no configurado'}
              </div>
              {!config._meta?.payment?.resend?.hasWebhookSecret && (
                <div className="text-[10px] text-muted-foreground mt-0.5">Webhook secret: opcional</div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Key className="w-3.5 h-3.5" /> Google Maps
              </div>
              <div className="text-emerald-400">Usado para geolocalización de gigs</div>
              <div className="text-[10px] text-muted-foreground mt-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="w-3.5 h-3.5" /> App URL
              </div>
              <div className="font-mono text-xs break-all">{config._meta?.payment?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}</div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="w-3.5 h-3.5" /> Current environment
              </div>
              <div className="font-semibold">{config._meta?.environment || process.env.NODE_ENV || 'unknown'}</div>
              <div className="text-[10px] text-muted-foreground mt-1">CRON_SECRET y otros jobs controlados por secrets</div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Estos valores vienen de variables de entorno del servidor. Cambios aquí requieren redeploy.</p>
        </div>

        {/* === MAIN CONFIG GRID === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Platform Economy & Fees */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <DollarSign className="text-emerald-400" />
                <h2 className="text-xl font-semibold">Platform Economy</h2>
              </div>
              <button
                onClick={() => resetSection('fees')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[28px] px-1.5 -mx-1.5 touch-manipulation"
                title="Restore default commissions and min payout"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="space-y-7">
              {/* Platform Commission */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <Label className="text-sm text-muted-foreground">Platform Commission</Label>
                  <span className="text-2xl font-semibold tabular-nums">{(config.commissionRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    value={config.commissionRate}
                    onChange={(e) => updateField('commissionRate', Math.max(0, Math.min(0.5, parseFloat(e.target.value) || 0)))}
                    className="w-24 bg-background border-border font-semibold"
                  />
                  <div className="flex gap-1.5">
                    {[0.08, 0.10, 0.12, 0.15, 0.20].map(r => (
                      <button key={r} onClick={() => setCommissionPreset(r)} className="text-[10px] px-2 py-1 min-h-[28px] rounded bg-muted hover:bg-muted/70 transition touch-manipulation">{(r*100)}%</button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Deducted from every completed order before paying the seller.</p>
                <div className="mt-2 text-xs bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl">
                  Example on $120,000 order: Platform receives <strong>{formatCOP(config.commissionRate * 120000)}</strong>
                </div>
              </div>

              {/* Referral Commission */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <Label className="text-sm text-muted-foreground">Referral Commission</Label>
                  <span className="text-2xl font-semibold tabular-nums">{((config.referralCommissionRate ?? 0.05) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.005"
                    min="0"
                    max="0.3"
                    value={config.referralCommissionRate ?? 0.05}
                    onChange={(e) => updateField('referralCommissionRate', Math.max(0, Math.min(0.3, parseFloat(e.target.value) || 0)))}
                    className="w-24 bg-background border-border font-semibold"
                  />
                  <div className="flex gap-1.5">
                    {[0.03, 0.05, 0.07, 0.10].map(r => (
                      <button key={r} onClick={() => setReferralPreset(r)} className="text-[10px] px-2 py-1 min-h-[28px] rounded bg-muted hover:bg-muted/70 transition touch-manipulation">{(r*100)}%</button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Paid to the referrer (who invited the seller) when an order completes.</p>
                <div className="mt-2 text-xs bg-amber-500/10 text-amber-400 p-2.5 rounded-xl">
                  Example: $120,000 order → Referrer receives <strong>{formatCOP((config.referralCommissionRate ?? 0.05) * 120000)}</strong>
                </div>
              </div>

              {/* Min Payout */}
              <div>
                <Label className="text-sm text-muted-foreground">Minimum payout amount for sellers</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xl text-muted-foreground">$</div>
                  <Input
                    type="number"
                    step="5000"
                    value={config.minPayoutAmount}
                    onChange={(e) => updateField('minPayoutAmount', Math.max(0, parseInt(e.target.value) || 0))}
                    className="bg-background border-border text-xl font-medium w-44"
                  />
                  <span className="text-muted-foreground">COP</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sellers must reach this threshold to request withdrawals.</p>
                <div className="text-[10px] text-muted-foreground mt-1">Actual: {formatCOP(config.minPayoutAmount)}</div>
              </div>
            </div>
          </div>

          {/* Support + Email Testing (combined) */}
          <div className="bg-card border border-border rounded-3xl p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="text-blue-400" />
                <h2 className="text-xl font-semibold">Support & Communications</h2>
              </div>
              <button
                onClick={() => resetSection('support')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[28px] px-1.5 -mx-1.5 touch-manipulation"
                title="Restore default emails and phone"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="space-y-5 flex-1">
              <div>
                <Label className="text-sm text-muted-foreground">Public support email</Label>
                <Input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => updateField('supportEmail', e.target.value)}
                  className="mt-2 bg-background border-border"
                  placeholder="support@fitmelive.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Used in footer, emails and support page.</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Support phone / WhatsApp (optional)</Label>
                <Input
                  type="tel"
                  value={config.supportPhone || ''}
                  onChange={(e) => updateField('supportPhone', e.target.value)}
                  className="mt-2 bg-background border-border"
                  placeholder="+57 300 123 4567"
                />
                <p className="text-xs text-muted-foreground mt-1">Can be shown on contact pages and in email templates.</p>
              </div>

              {/* Email Testing Tool */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-sm">Send test email</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={testEmailType}
                    onChange={(e) => setTestEmailType(e.target.value as typeof testEmailType)}
                    className="bg-background border border-border rounded-md px-3 py-2 text-sm flex-1"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="order">New order</option>
                    <option value="review">New review</option>
                    <option value="password-reset">Password reset</option>
                  </select>

                  <Input
                    placeholder="destino@ejemplo.com (opcional)"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="flex-1 bg-background border-border text-sm"
                  />

                  <Button
                    onClick={handleSendTestEmail}
                    disabled={testEmailSending}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    {testEmailSending ? 'Sending…' : 'Send test'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  If left empty it sends to the current admin. Direct sends are logged in audit.
                </p>

                {/* Test Email History (bulk/history "All" feature) */}
                <div className="pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Recent test sends (from audit)</span>
                    <button onClick={loadTestHistory} disabled={loadingTestHistory} className="text-[10px] text-orange-400 hover:underline">
                      {loadingTestHistory ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {testHistory.length > 0 ? (
                    <div className="max-h-28 overflow-auto text-[10px] bg-background border border-border rounded p-2 space-y-1 font-mono">
                      {testHistory.map((log, i) => (
                        <div key={i} className="flex justify-between gap-2 text-muted-foreground">
                          <span>{String(asAuditDetails(log.details)?.emailType ?? 'test')} → {String(asAuditDetails(log.details)?.to ?? 'self')}</span>
                          <span>{new Date(log.createdAt).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground">No test emails logged yet. Send one above.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="text-violet-400" />
                <h2 className="text-xl font-semibold">Features</h2>
              </div>
              <button
                onClick={() => resetSection('features')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[28px] px-1.5 -mx-1.5 touch-manipulation"
                title="Restore review and chat toggles"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">Reviews & Ratings</div>
                  <div className="text-sm text-muted-foreground">Allows buyers to rate and leave comments on sellers after a completed order.</div>
                </div>
                <Switch checked={config.enableReviews} onCheckedChange={(c) => updateField('enableReviews', c)} />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">Chat inside Orders</div>
                  <div className="text-sm text-muted-foreground">Enables real-time messaging + file attachments between buyer and seller while the order is active.</div>
                </div>
                <Switch checked={config.enableChat} onCheckedChange={(c) => updateField('enableChat', c)} />
              </div>

              <div className="pt-3 border-t text-xs text-muted-foreground">
                More granular flags (global push notifications, new categories, etc.) can be added here in the future.
              </div>
            </div>
          </div>

          {/* Branding (new full "All" feature) */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Globe className="text-pink-400" />
                <h2 className="text-xl font-semibold">Branding & Site Identity</h2>
              </div>
              <button
                onClick={() => resetSection('branding')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[28px] px-1.5 -mx-1.5 touch-manipulation"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-sm text-muted-foreground">Site Name</Label>
                <Input
                  value={config.siteName || ''}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  className="mt-1.5 bg-background border-border text-lg font-semibold"
                  placeholder="OigaGIG"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Tagline / Description</Label>
                <Input
                  value={config.siteTagline || ''}
                  onChange={(e) => updateField('siteTagline', e.target.value)}
                  className="mt-1.5 bg-background border-border"
                  placeholder="Conecta con profesionales locales en Colombia"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Logo URL (optional override)</Label>
                <Input
                  value={config.logoUrl || ''}
                  onChange={(e) => updateField('logoUrl', e.target.value || null)}
                  className="mt-1.5 bg-background border-border font-mono text-xs"
                  placeholder="/brand/oiga-gig-marketing.png or https://..."
                />
                <p className="text-[10px] text-muted-foreground mt-1">Site path (e.g. {BRAND_LOGO_PATH}, /icon.png) or HTTPS URL. Local dev paths like /workspaces/... are ignored. Leave empty for the default brand logo.</p>
              </div>
            </div>
          </div>

          {/* NEW: Growth, Referrals & Access Controls */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UserPlus className="text-indigo-400" />
                <h2 className="text-xl font-semibold">Growth & Access</h2>
              </div>
              <button
                onClick={() => resetSection('growth')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[28px] px-1.5 -mx-1.5 touch-manipulation"
                title="Restore referral and signup toggles"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium flex items-center gap-2">Referral Program <span className="text-[10px] px-1.5 py-px rounded bg-indigo-500/10 text-indigo-400">GLOBAL</span></div>
                  <div className="text-sm text-muted-foreground">Enables creation of ReferralEarnings when orders complete. Useful to temporarily pause the program without deleting data.</div>
                  {!config.referralsEnabled && (
                    <div className="mt-1 text-xs text-amber-400">Referrals disabled — no new referral credits will be generated.</div>
                  )}
                </div>
                <Switch checked={config.referralsEnabled} onCheckedChange={(c) => updateField('referralsEnabled', c)} />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">Allow new signups</div>
                  <div className="text-sm text-muted-foreground">Master switch for signup. When off, new users cannot create accounts (login/signup pages may show a message).</div>
                </div>
                <Switch checked={config.allowNewSignups} onCheckedChange={(c) => updateField('allowNewSignups', c)} />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Max upload file size (chat / orders)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={config.maxUploadSizeMB}
                    onChange={(e) => updateField('maxUploadSizeMB', Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                    className="w-24 bg-background border-border"
                  />
                  <span className="text-muted-foreground">MB</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per-file limit for OrderFile and chat attachments. Affects the upload component.</p>
              </div>
            </div>
          </div>

          {/* Global Notification Masters (more toggles) */}
          <div className="bg-card border border-border rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Mail className="text-emerald-400" />
                <h2 className="text-xl font-semibold">Global Notifications</h2>
              </div>
              <button
                onClick={() => resetSection('notifications')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[28px] px-1.5 -mx-1.5 touch-manipulation"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="space-y-6 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">Master Email Notifications</div>
                  <div className="text-muted-foreground text-xs">When off, most transactional emails are suppressed platform-wide (per-user prefs still respected when on).</div>
                </div>
                <Switch checked={config.globalEmailNotificationsEnabled} onCheckedChange={(c) => updateField('globalEmailNotificationsEnabled', c)} />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">Master Push Notifications</div>
                  <div className="text-muted-foreground text-xs">Global kill-switch for web push + desktop notifications.</div>
                </div>
                <Switch checked={config.globalPushNotificationsEnabled} onCheckedChange={(c) => updateField('globalPushNotificationsEnabled', c)} />
              </div>
            </div>
          </div>

          {/* Maintenance Mode - full width */}
          <div className="bg-card border border-border rounded-3xl p-8 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle />
                <h2 className="text-xl font-semibold">Modo Mantenimiento</h2>
              </div>
              <button
                onClick={() => resetSection('maintenance')}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition min-h-[32px] px-2 -mx-2 touch-manipulation"
              >
                <RotateCcw className="w-3 h-3" /> reset
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-8 gap-y-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Activar modo mantenimiento</div>
                  <Switch
                    checked={config.maintenanceMode}
                    onCheckedChange={(checked) => updateField('maintenanceMode', checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Activa un banner rojo + página de mantenimiento 503 para usuarios normales (no en la lista de bypass IPs). Login y /admin permanecen accesibles para que puedas desactivarlo.
                </p>
                {config.maintenanceMode && (
                  <div className="mt-3 text-xs px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                    Modo mantenimiento <strong>ACTIVO</strong>. Los usuarios verán el mensaje abajo.
                  </div>
                )}
              </div>

              <div className="lg:col-span-3">
                <Label className="text-xs text-muted-foreground">Mensaje para los usuarios</Label>
                <Textarea
                  value={config.maintenanceMessage || ''}
                  onChange={(e) => updateField('maintenanceMessage', e.target.value)}
                  className="mt-1.5 bg-background border-border"
                  rows={2}
                  placeholder="Estamos realizando mejoras. Volveremos pronto."
                />
              </div>
            </div>

            {/* Accurate live preview */}
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Vista previa exacta del banner (lo que ven los usuarios)</div>
              <div className="bg-red-600 text-white px-4 py-3 text-center font-semibold flex items-center justify-center gap-3 text-sm rounded-2xl shadow-inner">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{config.maintenanceMessage || "Estamos realizando mejoras. Volveremos pronto."}</span>
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              </div>
            </div>

            {/* Maintenance bypass IPs */}
            <div className="mt-6 pt-5 border-t border-border">
              <Label className="text-sm text-muted-foreground">Maintenance Bypass IPs (comma separated)</Label>
              <Input
                value={config.maintenanceBypassIps || ''}
                onChange={(e) => updateField('maintenanceBypassIps', e.target.value)}
                className="mt-1.5 font-mono text-sm sm:text-xs bg-background border-border"
                placeholder="203.0.113.5, 198.51.100.10"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Estas IPs no verán la página de mantenimiento ni el banner (acceso completo). Separa por comas. En producción usa la IP real del cliente (x-forwarded-for). La página de mantenimiento te mostrará tu IP detectada.</p>
            </div>
          </div>
        </div>

        {/* === Admin Security Section (kept prominent) === */}
        <div className="mt-6 bg-card border border-border rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/15 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Seguridad — Cuenta Administrador</h2>
              <p className="text-sm text-muted-foreground">Cambia la contraseña del usuario administrador actual (se propaga a toda la plataforma)</p>
            </div>
          </div>

          <form onSubmit={handleAdminChangePassword} className="max-w-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Contraseña actual</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showAdminCurrent ? 'text' : 'password'}
                    value={adminPasswordForm.currentPassword}
                    onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: e.target.value })}
                    placeholder="Actual"
                    className="bg-background border-border pr-9"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAdminCurrent(!showAdminCurrent)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-manipulation p-1 -m-1"
                    aria-label={showAdminCurrent ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showAdminCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showAdminNew ? 'text' : 'password'}
                    value={adminPasswordForm.newPassword}
                    onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                    placeholder="Mín. 8 caracteres"
                    required minLength={8}
                    className="bg-background border-border pr-9"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAdminNew(!showAdminNew)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-manipulation p-1 -m-1"
                    aria-label={showAdminNew ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showAdminNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Confirmar nueva</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showAdminConfirm ? 'text' : 'password'}
                    value={adminPasswordForm.confirmPassword}
                    onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                    placeholder="Repetir"
                    required
                    className="bg-background border-border pr-9"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAdminConfirm(!showAdminConfirm)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-manipulation p-1 -m-1"
                    aria-label={showAdminConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showAdminConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={adminPasswordLoading} className="bg-orange-600 hover:bg-orange-700">
                {adminPasswordLoading ? 'Actualizando…' : 'Actualizar Contraseña'}
              </Button>
              <span className="text-xs text-muted-foreground">El cambio es inmediato y afecta todos los despliegues que usen la misma base de datos.</span>
            </div>
          </form>
        </div>

        {/* === NEW: Recent Config Activity + Quick Audit Link === */}
        <RecentConfigActivity />

        {/* Danger Zone hint */}
        <div className="mt-4 p-4 border border-red-900/40 rounded-2xl bg-red-950/20 text-xs text-red-300/90">
          Zona de cuidado: Cambios en comisiones, mantenimiento o deshabilitar referidos/registros tienen impacto inmediato en usuarios y finanzas. Todos los cambios quedan registrados en <Link href="/admin/audit" className="underline">/admin/audit</Link>.
        </div>

        {/* Footer actions / info */}
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Todos los cambios de configuración se registran en <Link href="/admin/audit" className="text-orange-400 hover:underline inline-flex items-center gap-1">Auditoría <ExternalLink className="w-3 h-3" /></Link>.
            La comisión actual se usa para todos los cálculos de ganancias y pagos.
          </div>

          <button onClick={() => fetchConfig()} disabled={loading} className="flex items-center gap-1 hover:text-foreground transition">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recargar valores del servidor
          </button>
        </div>

        {/* Confirmation overlay / panel for risky saves */}
        {pendingSaveConfirm && (
          <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-6">
            <div className="bg-card border border-border rounded-3xl max-w-md w-full p-7">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-lg">{pendingSaveConfirm.reason}</div>
                  <p className="text-sm text-muted-foreground mt-2 leading-snug">{pendingSaveConfirm.details}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setPendingSaveConfirm(null)}
                  className="min-h-[44px] touch-manipulation w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleSave(true)} 
                  className="bg-orange-600 hover:bg-orange-700 min-h-[44px] touch-manipulation w-full sm:w-auto"
                >
                  Sí, guardar de todas formas
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
