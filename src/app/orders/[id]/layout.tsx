import OrderQuantityHydrate from '@/components/orders/OrderQuantityHydrate'

export default function OrderDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrderQuantityHydrate />
      {children}
    </>
  )
}
