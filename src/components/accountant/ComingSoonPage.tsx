import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="max-w-lg mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">This module is not available yet.</p>
          <Button asChild variant="outline">
            <Link href="/accountant">Back to overview</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}