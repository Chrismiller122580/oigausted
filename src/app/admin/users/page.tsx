'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  businessName?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  bio?: string | null;
  nit?: string | null;
  isActive?: boolean;
  createdAt: string;
  customReferralRate?: number | null;
  _count?: {
    gigs: number;
    ordersAsBuyer: number;
    ordersAsSeller: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Editing modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Role quick change (kept for speed)
  const [roleEditingId, setRoleEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (activeFilter !== 'all') params.append('active', activeFilter === 'active' ? 'true' : 'false');

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      const list = data.users || [];
      setUsers(list);
      setFilteredUsers(list);
    } catch (e) {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, activeFilter]);

  useEffect(() => {
    const filtered = users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const startRoleEdit = (user: User) => {
    setRoleEditingId(user.id);
    setNewRole(user.role);
  };

  const saveRole = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (res.ok) {
        toast.success('Role updated');
        setRoleEditingId(null);
        fetchUsers(); // refresh
      } else {
        toast.error('Could not update role');
      }
    } catch (e) {
      toast.error('Request error');
    }
  };

  const cancelEdit = () => {
    setRoleEditingId(null);
    setNewRole('');
  };

  // Full user editing
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      businessName: user.businessName || '',
      phone: user.phone || '',
      whatsapp: (user as any).whatsapp || '',

      bio: (user as any).bio || '',
      nit: (user as any).nit || '',
      customReferralRate: user.customReferralRate ?? '',
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
          ...editForm
        })
      });

      if (res.ok) {
        toast.success('User updated successfully');
        closeEditModal();
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Could not update user');
      }
    } catch (e) {
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
          userId: user.id,           // We'll need to support this in the API for admin
          newPassword: tempPassword,
          isAdminReset: true
        })
      });

      if (res.ok) {
        toast.success(`Temporary password: ${tempPassword}`, { duration: 15000 });
        // In real scenario we should send it by email instead of showing it
      } else {
        toast.error('Could not reset password');
      }
    } catch (e) {
      toast.error('Error resetting password');
    }
  };

  const toggleUserActive = async (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive })
      });

      if (res.ok) {
        toast.success(`User ${action}d successfully`);
        fetchUsers();
      } else {
        toast.error(`Could not ${action} user`);
      }
    } catch (e) {
      toast.error('Error changing status');
    }
  };

  const impersonateUser = async (user: User) => {
    if (!confirm(`Impersonate ${user.email}? This action will be logged.`)) return;

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        toast.success(`Opening session as ${user.email}...`);
        // Open their profile in a new tab with impersonation flag
        window.open(`/profile?impersonate=${user.id}`, '_blank');
      } else {
        toast.error('Could not start impersonation');
      }
    } catch (e) {
      toast.error('Error impersonating user');
    }
  };

  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Role', 'Active', 'Business', 'Custom Ref %', 'Phone', 'WhatsApp', 'City', 'Registration Date'];
    
    const rows = filteredUsers.map(u => [
      u.id,
      u.name || '',
      u.email,
      u.role,
      u.isActive ? 'Yes' : 'No',
      u.businessName || '',
      u.customReferralRate != null ? (u.customReferralRate * 100).toFixed(1) + '%' : 'default (5%)',
      u.phone || '',
      (u as any).whatsapp || '',
      (u as any).city || '',
      new Date(u.createdAt).toLocaleDateString('es-CO')
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success('Exporting users to CSV...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
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
            <p className="text-muted-foreground mt-1">Full account management • {users.length} registered</p>
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

            <Button onClick={exportToCSV} variant="outline" className="border-border">
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Negocio</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Ref Rate</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Gigs</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <p className="text-lg text-muted-foreground">No users found.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
                    </td>
                  </tr>
                )}
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-background">
                    <td className="p-4">
                      <div className="font-medium">{user.name || 'No name'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('es-CO')}</div>
                    </td>
                    <td className="p-4 text-foreground">{user.email}</td>
                    <td className="p-4">
                      {roleEditingId === user.id ? (
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="bg-muted border border-border rounded px-3 py-1 text-foreground"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          user.role === 'admin' ? 'bg-purple-600 text-white' :
                          user.role === 'seller' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-foreground">{user.businessName || '—'}</td>
                    <td className="p-4 text-center">
                      {user.customReferralRate != null ? (
                        <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          {(user.customReferralRate * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">default 5%</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive !== false ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                      }`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono">{user._count?.gigs || 0}</td>
                    <td className="p-4 text-right space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditModal(user)}
                        className="border-border hover:bg-muted"
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserPassword(user)}
                        className="border-amber-700 text-amber-400 hover:bg-amber-950"
                      >
                        Reset Pass
                      </Button>

                      <a 
                        href={`/seller/gigs?userId=${user.id}`} 
                        target="_blank"
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-muted inline-block"
                      >
                        Gigs
                      </a>
                      <a 
                        href={`/orders?userId=${user.id}`} 
                        target="_blank"
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-muted inline-block"
                      >
                        Orders
                      </a>

                      {roleEditingId === user.id ? (
                        <div className="inline-flex gap-1">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="bg-muted border border-border rounded px-2 py-1 text-xs"
                          >
                            <option value="buyer">Comprador</option>
                            <option value="seller">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button size="sm" onClick={() => saveRole(user.id)} className="bg-emerald-600 text-xs px-2">✓</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="text-xs px-2">✕</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startRoleEdit(user)}
                          className="border-border hover:bg-muted text-xs"
                        >
                          Role
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Role changes are immediate. Users will see the new options on their next login.
        </p>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Edit User</h3>
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
              </div>
              <Button variant="ghost" onClick={closeEditModal}>✕</Button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Business Name</Label>
                  <Input 
                    value={editForm.businessName} 
                    onChange={(e) => setEditForm({...editForm, businessName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input 
                    value={editForm.whatsapp} 
                    onChange={(e) => setEditForm({...editForm, whatsapp: e.target.value})}
                  />
                </div>

                <div>
                  <Label>NIT / Tax ID</Label>
                  <Input 
                    value={editForm.nit} 
                    onChange={(e) => setEditForm({...editForm, nit: e.target.value})}
                  />
                </div>

                {/* Special admin field for per-referrer custom commission */}
                <div className="md:col-span-2">
                  <Label>Custom Referral Commission Rate (overrides global 5%)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      type="number"
                      step="0.001"
                      min="0"
                      max="0.3"
                      placeholder="0.05 (default 5%)"
                      value={editForm.customReferralRate}
                      onChange={(e) => setEditForm({...editForm, customReferralRate: e.target.value})}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">% (leave blank for global default)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    This user will earn this % as referrer on their referred sellers' completed orders.
                  </p>
                </div>
              </div>

              <div>
                <Label>Bio / Description</Label>
                <Textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
              <Button onClick={saveUserEdit} disabled={saving} className="bg-emerald-600">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

