// Status badge component matching the reference design
type BadgeType = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray'

const BADGE_COLORS: Record<BadgeType, [string, string]> = {
  green:  ['#ECFDF5', '#065F46'],
  amber:  ['#FEF3C7', '#92400E'],
  red:    ['#FEF2F2', '#991B1B'],
  blue:   ['#E6F1FB', '#185FA5'],
  purple: ['#EDE9FE', '#5B21B6'],
  gray:   ['#F1F5F9', '#475569'],
}

interface StatusBadgeProps {
  label: string
  type?: BadgeType
}

export function StatusBadge({ label, type = 'green' }: StatusBadgeProps) {
  const [bg, txt] = BADGE_COLORS[type]
  return (
    <span
      style={{
        background: bg,
        color: txt,
        fontSize: '10px',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '6px',
        fontFamily: '"DM Sans", sans-serif',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

/** Map a payment status string to a badge type */
export function statusToBadgeType(status: string): BadgeType {
  switch (status) {
    case 'paid':     return 'green'
    case 'due_today': return 'amber'
    case 'overdue':  return 'red'
    default:         return 'blue'
  }
}

/** Human-readable label for a payment status */
export function statusLabel(status: string): string {
  switch (status) {
    case 'paid':      return 'Paid'
    case 'due_today': return 'Due today'
    case 'overdue':   return 'Overdue'
    default:          return 'Upcoming'
  }
}
