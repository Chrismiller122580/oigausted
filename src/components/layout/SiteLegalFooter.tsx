import Link from "next/link";

export default function SiteLegalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-center text-xs sm:flex-row sm:text-left sm:text-sm">
        <span>© {year} OigaGIG. Todos los derechos reservados.</span>
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/privacy" className="font-medium text-orange-600 hover:underline">
            Política de Tratamiento de Datos Personales
          </Link>
          <Link href="/terms" className="font-medium text-orange-600 hover:underline">
            Términos y Condiciones
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Soporte
          </Link>
        </nav>
      </div>
    </footer>
  );
}
