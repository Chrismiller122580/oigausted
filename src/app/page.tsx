// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarketingHomePage from "./(marketing)/page";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // Public / non-logged-in users see the marketing landing page
  if (!session?.user) {
    return <MarketingHomePage />;
  }

  // Logged-in users are sent to their role-specific dashboard
  const role = (session.user as any)?.role?.toLowerCase() || "buyer";

  if (role === "seller") {
    redirect("/seller");
  } else if (role === "buyer") {
    redirect("/buyer");
  } else if (role === "admin") {
    redirect("/admin");
  } else {
    redirect("/gigs");
  }
}
