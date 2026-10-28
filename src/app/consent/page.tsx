"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";

const POLICY_VERSION = "2026-10-28";

export default function ConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Debes autorizar el tratamiento de tus datos personales para continuar.");
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
        setError(data.error || "No se pudo registrar tu autorizaci\u00f3n.");
        setLoading(false);
        return;
      }
      toast.success("Autorizaci\u00f3n registrada. Gracias.");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Error de conexi\u00f3n. Int\u00e9ntalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Autorizaci\u00f3n de datos personales</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para continuar usando OigaGIG necesitamos tu autorizaci\u00f3n expresa para el tratamiento de tus datos personales.
          </p>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-2xl">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start gap-3">
            <input
              id="dataConsent"
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              required
            />
            <Label htmlFor="dataConsent" className="text-sm leading-relaxed cursor-pointer">
              Autorizo el tratamiento de mis datos personales conforme a la{" "}
              <Link href="/privacy" target="_blank" className="text-orange-600 hover:underline font-medium">
                Pol\u00edtica de Tratamiento de Datos Personales
              </Link>
              .
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !accepted}>
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Puedes consultar el texto completo en cualquier momento en{" "}
          <Link href="/privacy" className="text-orange-600 hover:underline">oigagig.com/privacy</Link>.
        </p>
      </div>
    </div>
  );
}
