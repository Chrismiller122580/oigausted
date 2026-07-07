import { redirect } from 'next/navigation';
import { requireStaffRoleFromDb } from '@/lib/staff-auth';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaffRoleFromDb('analytics');

  if (!session?.user) {
    redirect('/login?callbackUrl=/analytics');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}