import { redirect } from 'next/navigation';
import { requireRoleFromDb } from '@/lib/staff-auth';

export default async function AdminAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRoleFromDb('admin_assistant');

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin-assistant');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}