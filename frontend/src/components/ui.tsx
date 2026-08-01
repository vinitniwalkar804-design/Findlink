import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-blue-600 ${className}`} />;
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={40} />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}

export function EmptyState({ icon, title, message }: { icon?: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-gray-300">{icon}</div>}
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-400">{message}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}
