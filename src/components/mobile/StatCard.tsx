// Compact stat card used in dashboard stats row and Due Today summary bar
interface StatCardProps {
  value: string | number
  label: string
  color?: string
}

export function StatCard({ value, label, color = '#0F2744' }: StatCardProps) {
  return (
    <div
      style={{
        background: '#F8FAFC',
        borderRadius: '12px',
        padding: '12px 10px',
        textAlign: 'center',
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: '26px',
          fontWeight: 700,
          color,
          fontFamily: '"DM Serif Display", serif',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: '#64748B',
          marginTop: '4px',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        {label}
      </div>
    </div>
  )
}
