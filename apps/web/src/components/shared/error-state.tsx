import { Button } from '@/components/ui/button';

export function ErrorState({
  message = 'Algo deu errado ao carregar os dados.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
      <p className="text-sm text-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
