import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ fontFamily:'-apple-system,sans-serif', textAlign:'center', padding:'80px 24px', color:'#1a1a1a' }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🍽️</div>
      <h1 style={{ fontSize:26, fontWeight:700, marginBottom:8 }}>Page not found</h1>
      <p style={{ fontSize:14, color:'#888', marginBottom:28 }}>This dish isn't on our menu.</p>
      <Link href="/" style={{ background:'#E85D26', color:'#fff', borderRadius:24, padding:'12px 28px', fontSize:14, fontWeight:600, textDecoration:'none' }}>
        Back to homepage
      </Link>
    </div>
  )
}
