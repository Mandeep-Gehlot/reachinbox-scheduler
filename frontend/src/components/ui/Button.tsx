import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

const styles: Record<Variant, string> = {
  primary: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300',
  secondary: 'border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50',
};

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${styles[variant]} ${className}`}
    />
  );
}