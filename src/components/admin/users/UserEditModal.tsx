'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EditForm, User } from './types';

interface UserEditModalProps {
  user: User;
  editForm: EditForm;
  saving: boolean;
  onChange: (form: EditForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export function UserEditModal({
  user,
  editForm,
  saving,
  onChange,
  onClose,
  onSave,
}: UserEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Edit User</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full name</Label>
              <Input
                value={editForm.name ?? ''}
                onChange={(e) => onChange({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email ?? ''}
                onChange={(e) => onChange({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Business Name</Label>
              <Input
                value={editForm.businessName ?? ''}
                onChange={(e) => onChange({ ...editForm, businessName: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone ?? ''}
                onChange={(e) => onChange({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={editForm.whatsapp ?? ''}
                onChange={(e) => onChange({ ...editForm, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <Label>NIT / Tax ID</Label>
              <Input
                value={editForm.nit ?? ''}
                onChange={(e) => onChange({ ...editForm, nit: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={editForm.isActive !== false}
                onChange={(e) => onChange({ ...editForm, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label className="mb-0">Account Active (uncheck to deactivate user)</Label>
            </div>
            <div className="md:col-span-2">
              <Label>Custom Referral Commission Rate (overrides global 5%)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  max="0.3"
                  placeholder="0.05 (default 5%)"
                  value={editForm.customReferralRate ?? ''}
                  onChange={(e) => onChange({ ...editForm, customReferralRate: e.target.value || null })}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">% (leave blank for global default)</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                This user will earn this % as referrer on their referred sellers&apos; completed orders.
              </p>
            </div>
          </div>

          <div>
            <Label>Bio / Description</Label>
            <Textarea
              value={editForm.bio ?? ''}
              onChange={(e) => onChange({ ...editForm, bio: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving} className="bg-emerald-600">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}