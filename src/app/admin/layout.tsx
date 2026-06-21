import { redirect } from 'next/navigation';
import { requireAdminFromDb } from '@/lib/admin-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminFromDb();

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  // Note: The actual navbar is rendered by NavbarWrapper in the root layout
  // based on user role. We only keep this layout for auth protection.
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
      {/* Floating Grok chat (AI tool) hidden per request - the floating button is disabled */}
    </div>
  );
}
