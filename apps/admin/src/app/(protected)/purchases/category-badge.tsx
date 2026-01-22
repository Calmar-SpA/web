type CategoryBadgeProps = {
  name: string
  color?: string | null
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  const style = color ? { borderColor: color, color } : undefined
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
      style={style}
    >
      {name}
    </span>
  )
}
