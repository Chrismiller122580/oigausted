import Link from 'next/link'
import { Button } from '@/components/ui/button'

/** Placeholder — payroll module not shipped yet. */
export default function AccountantPayrollPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Nómina / pagos a vendedores</h1>
      <p className="mt-3 text-muted-foreground">
        La gestión de nómina formal no está habilitada. Usa el panel de payouts para pagos a vendedores.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/accountant/payouts">Payouts</Link>
        </Button>
        <Button asChild>
          <Link href="/accountant">Panel contable</Link>
        </Button>
      </div>
    </div>
  )
}
