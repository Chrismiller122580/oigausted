'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const role = (session.user as any)?.role?.toLowerCase() || "buyer";

    if (role === "seller") {
      router.replace("/seller");
    } else if (role === "buyer") {
      router.replace("/buyer");
    } else if (role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/gigs");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Redirecting...</h2>
      </div>
    </div>
  );
}
