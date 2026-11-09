"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

const POLICY_VERSION = "2026-10-28";

function ConsentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Debe autorizar el tratamiento de sus datos personales para continuar.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: POLICY_VERSION }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar su autorización.");
        setLoading(false);
        return;
      }
      toast.success("Autorización registrada. Gracias.");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Error de conexión. Intente de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Autorización de datos personales</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para continuar usando OigaGIG necesitamos su autorización expresa para el tratamiento de sus datos personales.
          </p>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-2xl">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border-2 border-orange-400 bg-orange-50 p-4 dark:border-orange-500 dark:bg-orange-950/40">
            <input
              id="dataConsent"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 rounded border-gray-400 text-orange-600 focus:ring-orange-500"
              required
            />
            <Label htmlFor="dataConsent" className="text-sm leading-relaxed cursor-pointer text-zinc-800 dark:text-zinc-100">
              <span className="font-semibold block">
                ¿Autoriza el tratamiento de sus datos personales?
              </span>
              <span className="block mt-1">
                Autorizo el tratamiento de mis datos personales conforme a la{" "}
                <Link href="/privacy" target="_blank" className="text-orange-700 hover:underline font-medium">
                  Política de Tratamiento de Datos Personales
                </Link>
                {" "}y los{" "}
                <Link href="/terms" target="_blank" className="text-orange-700 hover:underline font-medium">
                  Términos y Condiciones
                </Link>
                .
              </span>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !accepted}>
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Puede consultar el texto completo en{" "}
          <Link href="/privacy" className="text-orange-600 hover:underline">oigagig.com/privacy</Link>
          {" "}y{" "}
          <Link href="/terms" className="text-orange-600 hover:underline">oigagig.com/terms</Link>.
        </p>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <ConsentClient />
    </Suspense>
  );
}
