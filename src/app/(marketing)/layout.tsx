import { marketingHomeMetadata } from './metadata';

export const metadata = marketingHomeMetadata;

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground dark:bg-slate-950">
      {children}
    </div>
  );
}