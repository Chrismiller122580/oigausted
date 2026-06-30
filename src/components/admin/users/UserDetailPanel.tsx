'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  KeyRound,
  Pencil,
  Trash2,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { formatRelativeActive, isUserOnline } from '@/lib/presence';
import type { User } from './types';

interface UserDetailPanelProps {
  user: User;
  currentUserId?: string;
  onClose: () => void;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onImpersonate: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleActive: (user: User) => void;
  onSaveRole: (userId: string, role: string, staffRole: string | null) => Promise<void>;
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
    </div>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function truncateUserAgent(ua?: string | null): string {
  if (!ua) return '—';
  return ua.length > 60 ? `${ua.slice(0, 57)}...` : ua;
}

export function UserDetailPanel({
  user,
  currentUserId,
  onClose,
  onEdit,
  onResetPassword,
  onImpersonate,
  onDelete,
  onToggleActive,
  onSaveRole,
}: UserDetailPanelProps) {
  const [role, setRole] = useState(user.role);
  const [staffRole, setStaffRole] = useState(user.staffRole || '');
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    setRole(user.role);
    setStaffRole(user.staffRole || '');
  }, [user.id, user.role, user.staffRole]);

  const roleDirty = role !== user.role || (staffRole || null) !== (user.staffRole || null);
  const isSelf = user.id === currentUserId;
  const gigCount = user._count?.gigs ?? 0;
  const buyerOrders = user._count?.ordersAsBuyer ?? 0;
  const sellerOrders = user._count?.ordersAsSeller ?? 0;
  const refRate =
    user.customReferralRate != null
      ? `${(user.customReferralRate * 100).toFixed(1)}%`
      : 'Default (5%)';
  const ratingDisplay =
    (user.rating ?? 0) > 0
      ? `${user.rating?.toFixed(1)} (${user.reviewCount ?? 0} reviews)`
      : '—';

  const handleSaveRole = async () => {
    setSavingRole(true);
    try {
      await onSaveRole(user.id, role, staffRole || null);
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <Card className="bg-card border-border sticky top-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{user.name || 'No name'}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Joined {new Date(user.createdAt).toLocaleDateString('es-CO')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          <StatItem label="Gigs" value={gigCount} />
          <StatItem label="Buyer orders" value={buyerOrders} />
          <StatItem label="Seller orders" value={sellerOrders} />
          <StatItem label="Ref rate" value={refRate} />
          <StatItem label="Business" value={user.businessName || '—'} />
          <StatItem label="Phone" value={user.phone || '—'} />
        </div>

        <div className="mb-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Activity &amp; location
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <StatItem
              label="Status"
              value={isUserOnline(user.lastActiveAt) ? 'Online now' : 'Offline'}
            />
            <StatItem
              label="Last active"
              value={user.lastActiveAt ? formatRelativeActive(user.lastActiveAt) : '—'}
            />
            <StatItem label="Last login" value={formatDateTime(user.lastLoginAt)} />
            <StatItem label="Login location" value={user.lastLoginCity || '—'} />
            <StatItem label="Login IP" value={user.lastLoginIp || '—'} />
            <StatItem label="Device" value={truncateUserAgent(user.lastLoginUserAgent)} />
            <StatItem label="Profile city" value={user.city || '—'} />
            <StatItem label="Address" value={user.address || '—'} />
            <StatItem label="Rating" value={ratingDisplay} />
            <StatItem label="Last updated" value={formatDateTime(user.updatedAt)} />
            <StatItem label="Referral code" value={user.referralCode || '—'} />
            <StatItem label="WhatsApp" value={user.whatsapp || '—'} />
            <StatItem label="Referrals" value={user._count?.referrals ?? 0} />
          </div>
        </div>

        {user.role === 'seller' && (
          <div className="flex items-center justify-between mb-5 p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account status</p>
              <p className="text-sm font-medium">
                {user.isActive !== false ? 'Active' : 'Inactive'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleActive(user)}
            >
              {user.isActive !== false ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        )}

        <div className="space-y-3 mb-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Marketplace role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 bg-background border border-border rounded px-3 py-2 text-sm"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Staff role</Label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                className="w-full mt-1 bg-background border border-border rounded px-3 py-2 text-sm"
              >
                <option value="">No staff role</option>
                <option value="accountant">Accountant</option>
                <option value="admin_assistant">Admin Assistant</option>
              </select>
            </div>
          </div>
          {roleDirty && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveRole} disabled={savingRole} className="bg-emerald-600">
                {savingRole ? 'Saving...' : 'Save role'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRole(user.role);
                  setStaffRole(user.staffRole || '');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {user.role === 'seller' && (
            <a href={`/seller/gigs?userId=${user.id}`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-2">
                <ExternalLink size={14} />
                View gigs
              </Button>
            </a>
          )}
          <a href={`/orders?userId=${user.id}`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink size={14} />
              View orders
            </Button>
          </a>
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onEdit(user)}
          >
            <Pencil size={16} />
            Edit profile
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 border-amber-700 text-amber-400 hover:bg-amber-950"
            onClick={() => onResetPassword(user)}
          >
            <KeyRound size={16} />
            Reset password
          </Button>

          {!isSelf && (
            <Button
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => onImpersonate(user)}
            >
              <UserCog size={16} />
              Impersonate
            </Button>
          )}

          {!isSelf && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => onDelete(user)}
            >
              <Trash2 size={16} />
              Delete user
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}