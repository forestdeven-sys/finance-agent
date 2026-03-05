import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, suffix, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-black/40 border border-white/10 rounded-lg text-sm text-gray-200',
              'px-3 py-2 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20',
              'placeholder:text-gray-600 transition-colors',
              icon && 'pl-9',
              suffix && 'pr-10',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{suffix}</div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
