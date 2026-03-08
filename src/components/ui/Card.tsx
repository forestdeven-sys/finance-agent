import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  variant?: 'default' | 'strong' | 'bordered'
}

export function Card({ children, className, title, subtitle, actions, variant = 'default' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-4',
        variant === 'default' && 'glass',
        variant === 'strong' && 'glass-strong',
        variant === 'bordered' && 'border border-cyan-500/30 bg-black/40',
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">{title}</h3>
            )}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
