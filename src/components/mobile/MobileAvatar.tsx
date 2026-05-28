// Initials avatar with color variants matching the reference design
interface AvatarProps {
  initials: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'coral' | 'navy'
  size?: number
}

const COLOR_MAP: Record<string, [string, string]> = {
  blue:   ['#E6F1FB', '#185FA5'],
  green:  ['#ECFDF5', '#065F46'],
  amber:  ['#FEF3C7', '#92400E'],
  red:    ['#FEF2F2', '#991B1B'],
  purple: ['#EDE9FE', '#5B21B6'],
  coral:  ['#FAECE7', '#993C1D'],
  navy:   ['#E6F1FB', '#0F2744'],
}

export function MobileAvatar({ initials, color = 'blue', size = 40 }: AvatarProps) {
  const [bg, txt] = COLOR_MAP[color] ?? COLOR_MAP.blue
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: txt,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: Math.round(size * 0.32),
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: '0.5px',
      }}
    >
      {initials}
    </div>
  )
}

/** Deterministically pick an avatar color from a name */
const COLORS = ['blue', 'green', 'amber', 'purple', 'coral', 'red'] as const
export function colorFromName(name: string): typeof COLORS[number] {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

/** Get initials from a full name */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
