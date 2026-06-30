'use client';

import { Card, CardContent } from '@/components/ui/card';
import { isUserOnline } from '@/lib/presence';
import type { User } from './types';

interface UserListCardProps {
  user: User;
  selected: boolean;
  onSelect: (user: User) => void;
}

function RoleBadge({ role }: { role: string }) {
  const className =
    role === 'admin'
      ? 'bg-purple-600 text-white'
      : role === 'seller'
        ? 'bg-orange-600 text-white'
        : 'bg-blue-600 text-white';

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${className}`}>
      {role}
    </span>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export function UserListCard({ user, selected, onSelect }: UserListCardProps) {
  const gigCount = user._count?.gigs ?? 0;
  const location = user.lastLoginCity || user.city || null;
  const online = isUserOnline(user.lastActiveAt);

  return (
    <Card
      className={`bg-card border-border cursor-pointer hover:border-orange-500 transition-colors ${
        selected ? 'ring-2 ring-orange-500' : ''
      }`}
      onClick={() => onSelect(user)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{user.name || 'No name'}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Last login: {formatDateTime(user.lastLoginAt)}
              {location ? ` · ${location}` : ''}
            </p>
          </div>
          <div
            className="text-right text-xs text-muted-foreground shrink-0"
            title="Registration date"
          >
            Joined {new Date(user.createdAt).toLocaleDateString('es-CO')}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {online && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600/20 text-emerald-400">
              Online
            </span>
          )}
          <RoleBadge role={user.role} />
          {user.staffRole && (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                user.staffRole === 'accountant' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              {user.staffRole.replace('_', ' ')}
            </span>
          )}
          {user.role === 'seller' && (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                user.isActive !== false
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-red-600/20 text-red-400'
              }`}
            >
              {user.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          )}
          {(user.contactViolationCount ?? 0) > 0 && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {user.contactViolationCount} chat violation{(user.contactViolationCount ?? 0) !== 1 ? 's' : ''}
            </span>
          )}
          {user.contactFlaggedAt && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
              Flagged
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {gigCount} gig{gigCount !== 1 ? 's' : ''}
          {user.businessName ? ` • ${user.businessName}` : ''}
          {(user.rating ?? 0) > 0 ? ` • ${user.rating?.toFixed(1)}★ (${user.reviewCount ?? 0})` : ''}
        </p>
      </CardContent>
    </Card>
  );
}