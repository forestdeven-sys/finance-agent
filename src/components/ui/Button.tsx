import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all rounded-lg border',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          size === 'sm' && 'px-3 py-1.5 text-xs gap-1.5',
          size === 'md' && 'px-4 py-2 text-sm gap-2',
          size === 'lg' && 'px-6 py-3 text-base gap-2',
          variant === 'primary' &&
            'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-400',
          variant === 'secondary' &&
            'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20',
          variant === 'ghost' && 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5',
          variant === 'danger' &&
            'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30 hover:border-red-400',
          variant === 'success' &&
            'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30 hover:border-green-400',
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
