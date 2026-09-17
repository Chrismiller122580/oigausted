import { redirect } from 'next/navigation';
import { requireAdminFromDb } from '@/lib/admin-auth';
import AdminClientBoot from '@/components/admin/AdminClientBoot';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminFromDb();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminClientBoot />
      {children}
    </div>
  );
}
