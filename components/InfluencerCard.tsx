import Link from 'next/link'
import Image from 'next/image'
import type { Influencer } from '@/types/database'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2' }
const PALETTE = [
  { bg: '#FEF0EA', color: '#E85D26' }, { bg: '#EAF8EE', color: '#2E9E55' },
  { bg: '#F3EFFE', color: '#7F77DD' }, { bg: '#FEF5EA', color: '#D4860A' },
  { bg: '#EAF4FE', color: '#2E7BD4' }, { bg: '#FEEBF0', color: '#D4204D' },
  { bg: '#F5FEEA', color: '#5DA618' }, { bg: '#FEF9EA', color: '#B8860B' },
]

interface Props {
  influencer: Influencer
  index?: number
  rank?: number
  compact?: boolean
}

export default function InfluencerCard({ influencer: inf, index = 0, rank, compact = false }: Props) {
  const p = PALETTE[index % PALETTE.length]

  return (
    <Link href={`/influencers/${inf.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article
        style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: compact ? 14 : 20, textAlign: 'center', height: '100%' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 20px ${p.color}25`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        {rank && (
          <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF0EA', color: C.coral, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}
            aria-label={`Ranked #${rank} this week`}>
            🏆 #{rank}
          </div>
        )}

        {/* Avatar */}
        <div style={{ width: compact ? 44 : 60, height: compact ? 44 : 60, borderRadius: '50%', margin: '0 auto 10px', background: p.bg, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: compact ? 15 : 20, border: `2px solid ${p.color}30`, position: 'relative', overflow: 'hidden' }}
          aria-hidden="true">
          {inf.avatar_url ? (
            <img src={inf.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : inf.avatar_initials}
        </div>

        <div style={{ fontSize: compact ? 13 : 15, fontWeight: 600, marginBottom: 2 }}>{inf.name}</div>
        <div style={{ fontSize: 11, color: '#aaa', marginBottom: compact ? 8 : 12 }}>
          {inf.handle} · {(inf.followers_count / 1000).toFixed(0)}K
        </div>

        {!compact && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            {inf.cuisine_tags.slice(0, 2).map(t => (
              <span key={t} style={{ fontSize: 10, background: '#f5f0eb', color: '#666', padding: '2px 8px', borderRadius: 8 }}>{t}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${C.border}`, paddingTop: compact ? 8 : 12 }}>
          <div>
            <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: C.coral }}>{inf.impact_score}%</div>
            <div style={{ fontSize: 9, color: '#aaa' }}>Impact</div>
          </div>
          <div>
            <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700 }}>{inf.visits_driven_weekly}</div>
            <div style={{ fontSize: 9, color: '#aaa' }}>Visits/wk</div>
          </div>
          <div>
            <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700 }}>₹{(inf.connection_fee / 1000).toFixed(0)}K</div>
            <div style={{ fontSize: 9, color: '#aaa' }}>Fee</div>
          </div>
        </div>
      </article>
    </Link>
  )
}
