'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

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
      toast.error('Error cargando usuarios');
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
        toast.success('Rol actualizado');
        setEditingId(null);
        fetchUsers(); // refresh
      } else {
        toast.error('No se pudo actualizar el rol');
      }
    } catch (e) {
      toast.error('Error en la petición');
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
      city: (user as any).city || '',
      bio: (user as any).bio || '',
      nit: (user as any).nit || '',
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
        toast.success('Usuario actualizado correctamente');
        closeEditModal();
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'No se pudo actualizar el usuario');
      }
    } catch (e) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const resetUserPassword = async (user: User) => {
    if (!confirm(`¿Resetear contraseña de ${user.email}? Se generará una temporal.`)) return;

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
        toast.success(`Contraseña temporal: ${tempPassword}`, { duration: 15000 });
        // In real scenario we should send it by email instead of showing it
      } else {
        toast.error('No se pudo resetear la contraseña');
      }
    } catch (e) {
      toast.error('Error al resetear contraseña');
    }
  };

  const toggleUserActive = async (user: User) => {
    const action = user.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.email}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive })
      });

      if (res.ok) {
        toast.success(`Usuario ${action}do correctamente`);
        fetchUsers();
      } else {
        toast.error(`No se pudo ${action} el usuario`);
      }
    } catch (e) {
      toast.error('Error al cambiar estado');
    }
  };

  const impersonateUser = async (user: User) => {
    if (!confirm(`¿Impersonar a ${user.email}? Esta acción registrará la actividad.`)) return;

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        toast.success(`Abriendo sesión como ${user.email}...`);
        // Open their profile in a new tab with impersonation flag
        window.open(`/profile?impersonate=${user.id}`, '_blank');
      } else {
        toast.error('No se pudo iniciar impersonación');
      }
    } catch (e) {
      toast.error('Error al impersonar usuario');
    }
  };

  const exportToCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No hay usuarios para exportar');
      return;
    }

    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Activo', 'Negocio', 'Teléfono', 'WhatsApp', 'Ciudad', 'Fecha Registro'];
    
    const rows = filteredUsers.map(u => [
      u.id,
      u.name || '',
      u.email,
      u.role,
      u.isActive ? 'Sí' : 'No',
      u.businessName || '',
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
    link.download = `usuarios_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success('Exportando usuarios a CSV...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-zinc-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-bold">Usuarios</h1>
            <p className="text-zinc-400 mt-1">Gestión completa de cuentas • {users.length} registrados</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-zinc-900 border-zinc-700"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
            >
              <option value="all">Todos los roles</option>
              <option value="buyer">Compradores</option>
              <option value="seller">Vendedores</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Desactivados</option>
            </select>

            <Button onClick={exportToCSV} variant="outline" className="border-zinc-700">
              Exportar CSV
            </Button>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950">
                <tr>
                  <th className="text-left p-4 font-medium text-zinc-400">Usuario</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Email</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Rol</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Estado</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Negocio</th>
                  <th className="text-center p-4 font-medium text-zinc-400">Gigs</th>
                  <th className="text-right p-4 font-medium text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <p className="text-lg text-zinc-400">No se encontraron usuarios.</p>
                      <p className="text-sm text-zinc-500 mt-1">Intenta con otro término de búsqueda.</p>
                    </td>
                  </tr>
                )}
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-950">
                    <td className="p-4">
                      <div className="font-medium">{user.name || 'Sin nombre'}</div>
                      <div className="text-xs text-zinc-500">{new Date(user.createdAt).toLocaleDateString('es-CO')}</div>
                    </td>
                    <td className="p-4 text-zinc-300">{user.email}</td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-white"
                        >
                          <option value="buyer">Comprador</option>
                          <option value="seller">Vendedor</option>
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
                    <td className="p-4 text-zinc-300">{user.businessName || '—'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive !== false ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                      }`}>
                        {user.isActive !== false ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono">{user._count?.gigs || 0}</td>
                    <td className="p-4 text-right space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditModal(user)}
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        Editar
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
                        className="text-xs px-2 py-1 border border-zinc-700 rounded hover:bg-zinc-800 inline-block"
                      >
                        Gigs
                      </a>
                      <a 
                        href={`/orders?userId=${user.id}`} 
                        target="_blank"
                        className="text-xs px-2 py-1 border border-zinc-700 rounded hover:bg-zinc-800 inline-block"
                      >
                        Pedidos
                      </a>

                      {roleEditingId === user.id ? (
                        <div className="inline-flex gap-1">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
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
                          className="border-zinc-700 hover:bg-zinc-800 text-xs"
                        >
                          Rol
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Cambiar roles es inmediato. Los usuarios verán las nuevas opciones en su siguiente sesión.
        </p>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Editar Usuario</h3>
                <p className="text-sm text-zinc-400">{editingUser.email}</p>
              </div>
              <Button variant="ghost" onClick={closeEditModal}>✕</Button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre completo</Label>
                  <Input 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Nombre del Negocio</Label>
                  <Input 
                    value={editForm.businessName} 
                    onChange={(e) => setEditForm({...editForm, businessName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
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
                  <Label>Ciudad</Label>
                  <Input 
                    value={editForm.city} 
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label>NIT</Label>
                  <Input 
                    value={editForm.nit} 
                    onChange={(e) => setEditForm({...editForm, nit: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Biografía / Descripción</Label>
                <Textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <Button variant="outline" onClick={closeEditModal}>Cancelar</Button>
              <Button onClick={saveUserEdit} disabled={saving} className="bg-emerald-600">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

