import { redirect } from 'next/navigation';
import { requireRoleFromDb } from '@/lib/staff-auth';

export default async function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRoleFromDb('accountant');

  if (!session?.user) {
    redirect('/login?callbackUrl=/accountant');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}