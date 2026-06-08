// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Admin protection (consistent with isAdmin helper)
  if (!session?.user || !isAdmin(session)) {
    redirect('/login?callbackUrl=/admin');
  }

  // Note: The actual navbar is rendered by NavbarWrapper in the root layout
  // based on user role. We only keep this layout for auth protection.
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
