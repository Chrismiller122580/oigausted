import CheckoutQuantityGuard from './CheckoutQuantityGuard';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CheckoutQuantityGuard />
      {children}
    </>
  );
}
