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
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
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
  }, []);

  useEffect(() => {
    const filtered = users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const startRoleEdit = (user: User) => {
    setEditingId(user.id);
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
    setEditingId(null);
    setNewRole('');
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold">Usuarios</h1>
            <p className="text-zinc-400 mt-1">Gestión de roles y cuentas • {users.length} registrados</p>
          </div>
          <Input
            placeholder="Buscar por nombre, email o negocio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm bg-zinc-900 border-zinc-700"
          />
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950">
                <tr>
                  <th className="text-left p-4 font-medium text-zinc-400">Usuario</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Email</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Rol</th>
                  <th className="text-left p-4 font-medium text-zinc-400">Negocio</th>
                  <th className="text-center p-4 font-medium text-zinc-400">Gigs</th>
                  <th className="text-center p-4 font-medium text-zinc-400">Pedidos</th>
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
                    <td className="p-4 text-center font-mono">{user._count?.gigs || 0}</td>
                    <td className="p-4 text-center font-mono text-xs">
                      {user._count?.ordersAsSeller || 0} vendidos
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {editingId === user.id ? (
                        <>
                          <Button size="sm" onClick={() => saveRole(user.id)} className="bg-emerald-600">Guardar</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancelar</Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startRoleEdit(user)}
                          className="border-zinc-700 hover:bg-zinc-800"
                        >
                          Cambiar Rol
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
    </div>
  );
}

