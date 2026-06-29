import { redirect } from 'next/navigation';
import { requireStaffRoleFromDb } from '@/lib/staff-auth';

export default async function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaffRoleFromDb('accountant');

  if (!session?.user) {
    redirect('/login?callbackUrl=/accountant');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}