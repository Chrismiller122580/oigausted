import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Basic admin protection for beta
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/login?callbackUrl=/admin');
  }

  // Note: The actual navbar is rendered by NavbarWrapper in the root layout
  // based on user role. We only keep this layout for auth protection.
  return <>{children}</>;
}
