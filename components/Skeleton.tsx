export function CardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #ede8e2', borderRadius:14, overflow:'hidden', height }}>
      <div style={{ height:'100%', background:'linear-gradient(90deg, #f5f0eb 25%, #faf7f4 50%, #f5f0eb 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}

export function GridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:16 }}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:14, color:'#aaa', fontFamily:'sans-serif' }}>
      <div style={{ width:40, height:40, border:'3px solid #f5ede5', borderTop:'3px solid #E85D26', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize:13 }}>Loading…</span>
    </div>
  )
}
