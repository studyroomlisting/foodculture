import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <div style={{ background:'#1a1a1a', padding:'40px 24px', textAlign:'center' }}>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff', marginBottom:10, lineHeight:1.3 }}>
          Your city&apos;s food pulse,<br /><span style={{ color:'#E85D26' }}>powered by AI</span>
        </div>
        <p style={{ fontSize:13, color:'#555', marginBottom:22 }}>Join 200+ Bengaluru restaurants already on the waitlist</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/dashboard" style={{ background:'#E85D26', borderRadius:24, padding:'12px 24px', color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none' }}>
            Restaurant dashboard →
          </Link>
          <Link href="/explore" style={{ background:'transparent', border:'1px solid #444', borderRadius:24, padding:'12px 24px', color:'#888', fontSize:13, textDecoration:'none' }}>
            Explore the map
          </Link>
        </div>
      </div>
      <div style={{ background:'#111', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <Link href="/" style={{ fontSize:13, fontWeight:700, color:'#fff', textDecoration:'none' }}>
          Food<span style={{ color:'#E85D26' }}>Culture</span>.ai
        </Link>
        <div style={{ display:'flex', gap:20 }}>
          {[['/restaurants','Restaurants'],['/influencers','Influencers'],['/trending','Trending'],['/explore','Explore'],['/deals','Deals'],['/notifications','Notifications']].map(([h,l]) => (
            <Link key={h} href={h} style={{ fontSize:12, color:'#555', textDecoration:'none' }}>{l}</Link>
          ))}
        </div>
        <div style={{ display:'flex', gap:16, fontSize:11, color:'#444' }}>
          <span>© 2026 FoodCulture AI</span>
          <a href="/terms" style={{ color:'#555', textDecoration:'none' }}>Terms</a>
          <a href="/privacy" style={{ color:'#555', textDecoration:'none' }}>Privacy</a>
          <a href="/account/delete" style={{ color:'#555', textDecoration:'none' }}>Delete account</a>
        </div>
      </div>
    </>
  )
}
