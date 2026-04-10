import type { ReactNode } from 'react';

interface ResponsiveTableProps {
  children?: ReactNode;
  [key: string]: unknown;
}

/** Wraps <table> in a scrollable container so wide tables don't overflow. */
export function ResponsiveTable({ children, ...rest }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto max-w-full -mx-2 px-2">
      <table {...rest}>{children}</table>
    </div>
  );
}
