import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'none'
}

const PADDING_CLASSES: Record<NonNullable<Props['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
}

export function Card({ padding = 'md', className = '', children, ...rest }: Props) {
  return (
    <div className={`rounded-2xl bg-surface card-shadow ${PADDING_CLASSES[padding]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
