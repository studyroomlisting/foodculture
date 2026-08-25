import Link from 'next/link'

export default function Breadcrumbs({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize:13, color:'#888', padding:'12px 0', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
          {i > 0 && <span aria-hidden="true" style={{ color:'#ccc' }}>›</span>}
          {c.href
            ? <Link href={c.href} style={{ color:'#888', textDecoration:'none' }}>{c.label}</Link>
            : <span style={{ color:'#1a1a1a', fontWeight:500 }}>{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
