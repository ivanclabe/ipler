interface Props {
  className?: string
  variant?: 'text' | 'block' | 'circle'
}

const VARIANT_CLASSES: Record<NonNullable<Props['variant']>, string> = {
  text: 'rounded h-3',
  block: 'rounded-lg',
  circle: 'rounded-full',
}

export function Skeleton({ className = '', variant = 'block' }: Props) {
  return <div className={`animate-pulse bg-surface-2 ${VARIANT_CLASSES[variant]} ${className}`} />
}
