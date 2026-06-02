'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (targetTypeFilter) params.append('targetType', targetTypeFilter);
      // Always request a decent number so new logs show up
      params.append('limit', '100');

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLastUpdated(new Date());
    } catch (e) {
      if (!isBackground) toast.error('Error cargando registros de auditoría');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetTypeFilter]);

  // Auto-refresh so logs "update" live without manual browser reload (every 15s when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true); // background refresh, no loading spinner
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, actionFilter, targetTypeFilter]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold">Registro de Auditoría</h1>
          <p className="text-muted-foreground mt-1">
            Historial de acciones realizadas por administradores
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Input
            placeholder="Filtrar por acción (ej: USER o ROLE)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Filtrar por tipo (ej: User o Gig)"
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => { setActionFilter(''); setTargetTypeFilter(''); }}>
            Limpiar Filtros
          </Button>
          <Button variant="outline" onClick={() => fetchLogs(false)} disabled={loading}>
            Refrescar
          </Button>
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            {autoRefresh ? '⏸ Pausar auto' : '▶ Auto-actualizar (15s)'}
          </Button>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground ml-2">
              Actualizado: {lastUpdated.toLocaleTimeString('es-CO')}
            </span>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Cargando registros...</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No se encontraron registros.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4">Fecha</th>
                      <th className="text-left p-4">Admin</th>
                      <th className="text-left p-4">Acción</th>
                      <th className="text-left p-4">Recurso</th>
                      <th className="text-left p-4">Detalles</th>
                      <th className="text-left p-4">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('es-CO')}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{log.admin.name || log.admin.email}</div>
                          <div className="text-xs text-muted-foreground">{log.admin.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {log.targetType}
                          {log.targetId && (
                            <span className="block text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                              {log.targetId}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {log.details && (
                            <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground font-mono">
                          {log.ipAddress || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
