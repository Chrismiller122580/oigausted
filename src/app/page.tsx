import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getPostLoginRedirectPath } from '@/lib/session';
import MarketingHomePageServer from './(marketing)/MarketingHomePageServer';
import { marketingHomeMetadata } from './(marketing)/metadata';

export const metadata = marketingHomeMetadata;
export const revalidate = 60;

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // Public / non-logged-in users see the marketing landing page
  if (!session?.user) {
    return <MarketingHomePageServer />;
  }

  redirect(getPostLoginRedirectPath(session));
}
