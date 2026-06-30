'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserListCard } from '@/components/admin/users/UserListCard';
import { UserDetailPanel } from '@/components/admin/users/UserDetailPanel';
import { UserEditModal } from '@/components/admin/users/UserEditModal';
import type { EditForm, User } from '@/components/admin/users/types';

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const { data: currentSession, update } = useSession();
  const currentUserId = currentSession?.user?.id;
  const detailRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [onlineFilter, setOnlineFilter] = useState(
    () => searchParams.get('online') === 'true'
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (activeFilter !== 'all') params.append('active', activeFilter === 'active' ? 'true' : 'false');
      if (onlineFilter) params.append('online', 'true');

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      const list = data.users || [];
      setUsers(list);
      setFilteredUsers(list);
    } catch {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [roleFilter, activeFilter, onlineFilter]);

  useEffect(() => {
    const filtered = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    setPage(1);
  }, [searchTerm, users]);

  useEffect(() => {
    if (selectedUser) {
      const updated = filteredUsers.find((u) => u.id === selectedUser.id);
      if (updated) {
        setSelectedUser(updated);
      } else {
        setSelectedUser(null);
      }
    }
  }, [filteredUsers, selectedUser?.id]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectUser = (user: User) => {
    setSelectedUser(user);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const saveRole = async (userId: string, role: string, staffRole: string | null) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role,
          staffRole,
        }),
      });

      if (res.ok) {
        toast.success('Role updated');
        await fetchUsers();
      } else {
        toast.error('Could not update role');
      }
    } catch {
      toast.error('Request error');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      businessName: user.businessName || '',
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      bio: user.bio || '',
      nit: user.nit || '',
      isActive: user.isActive !== false,
      customReferralRate: user.customReferralRate ?? null,
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          ...editForm,
        }),
      });

      if (res.ok) {
        toast.success('User updated successfully');
        closeEditModal();
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Could not update user');
      }
    } catch {
      toast.error('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const resetUserPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.email}? A temporary one will be generated.`)) return;

    try {
      const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 10) + '!';

      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPassword: tempPassword,
          isAdminReset: true,
        }),
      });

      if (res.ok) {
        toast.success(`Temporary password: ${tempPassword}`, { duration: 15000 });
      } else {
        toast.error('Could not reset password');
      }
    } catch {
      toast.error('Error resetting password');
    }
  };

  const toggleUserActive = async (user: User) => {
    const action = user.isActive !== false ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: user.isActive === false }),
      });

      if (res.ok) {
        toast.success(`User ${action}d successfully`);
        fetchUsers();
      } else {
        toast.error(`Could not ${action} user`);
      }
    } catch {
      toast.error('Error changing status');
    }
  };

  const impersonateUser = async (user: User) => {
    if (
      !confirm(
        `Impersonate ${user.email || user.name}? This will switch you into their account (all actions will be performed as them). This is logged for audit.`
      )
    )
      return;

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.impersonationToken) {
          toast.error('No impersonation token received');
          return;
        }
        toast.success(`Switching to ${user.email}...`);
        await update({ impersonationToken: data.impersonationToken });
        window.location.href = '/';
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Could not start impersonation');
      }
    } catch {
      toast.error('Error impersonating user');
    }
  };

  const deleteUser = async (user: User) => {
    if (user.id === currentUserId) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (
      !confirm(
        `Delete user ${user.email}?\n\nIf they have gigs or orders they will be DEACTIVATED instead (recommended for data integrity). This cannot be undone for permanent deletion.`
      )
    )
      return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.deactivatedInstead) {
          toast.success(data.message || 'User deactivated instead (had activity).');
        } else {
          toast.success('User deleted permanently.');
        }
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Could not delete user (may have activity — deactivate instead)');
      }
    } catch {
      toast.error('Error deleting user');
    }
  };

  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = [
      'ID',
      'Name',
      'Email',
      'Role',
      'Active',
      'Business',
      'Custom Ref %',
      'Phone',
      'WhatsApp',
      'Last Login',
      'Login City',
      'Login IP',
      'Profile City',
      'Rating',
      'Reviews',
      'Last Updated',
      'Registration Date',
    ];

    const rows = filteredUsers.map((u) => [
      u.id,
      u.name || '',
      u.email,
      u.role,
      u.isActive !== false ? 'Yes' : 'No',
      u.businessName || '',
      u.customReferralRate != null ? (u.customReferralRate * 100).toFixed(1) + '%' : 'default (5%)',
      u.phone || '',
      u.whatsapp || '',
      u.lastLoginAt
        ? new Date(u.lastLoginAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
        : '',
      u.lastLoginCity || '',
      u.lastLoginIp || '',
      u.city || '',
      (u.rating ?? 0) > 0 ? String(u.rating) : '',
      u.reviewCount ?? 0,
      u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('es-CO') : '',
      new Date(u.createdAt).toLocaleDateString('es-CO'),
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('Exporting users to CSV...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-bold">Users</h1>
            <p className="text-muted-foreground mt-1">
              Full account management • Showing {filteredUsers.length} of {users.length} registered
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-card border-border"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-card border border-border rounded px-3 py-2 text-sm"
            >
              <option value="all">All roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
              <option value="accountant">Accountants</option>
              <option value="admin_assistant">Admin Assistants</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-card border border-border rounded px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button
              variant={onlineFilter ? 'default' : 'outline'}
              className={onlineFilter ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-border'}
              onClick={() => setOnlineFilter((v) => !v)}
            >
              {onlineFilter ? 'Online only' : 'Show online'}
            </Button>

            <Button onClick={exportToCSV} variant="outline" className="border-border">
              Export CSV
            </Button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <p className="text-lg text-muted-foreground">No users found.</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {paginatedUsers.map((user) => (
                <UserListCard
                  key={user.id}
                  user={user}
                  selected={selectedUser?.id === user.id}
                  onSelect={selectUser}
                />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <div ref={detailRef}>
              {selectedUser ? (
                <UserDetailPanel
                  user={selectedUser}
                  currentUserId={currentUserId}
                  onClose={() => setSelectedUser(null)}
                  onEdit={openEditModal}
                  onResetPassword={resetUserPassword}
                  onImpersonate={impersonateUser}
                  onDelete={deleteUser}
                  onToggleActive={toggleUserActive}
                  onSaveRole={saveRole}
                />
              ) : (
                <div className="text-muted-foreground p-8 border border-dashed border-border rounded-2xl text-center sticky top-8">
                  Select a user to view details and manage their account.
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Role changes are immediate. Users will see the new options on their next login.
        </p>
      </div>

      {editingUser && (
        <UserEditModal
          user={editingUser}
          editForm={editForm}
          saving={saving}
          onChange={setEditForm}
          onClose={closeEditModal}
          onSave={saveUserEdit}
        />
      )}
    </div>
  );
}