import Link from 'next/link'
import Image from 'next/image'
import type { Restaurant } from '@/types/database'

const C = { coral: '#E85D26', green: '#2E9E55', amber: '#D4860A', border: '#ede8e2' }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  viral:  { bg: '#FEF0EA', color: C.coral, label: 'Viral'  },
  rising: { bg: '#EAF8EE', color: C.green, label: 'Rising' },
  new:    { bg: '#FEF9EA', color: C.amber, label: 'New'    },
  active: { bg: '#f0f0f0', color: '#888',  label: 'Active' },
}

interface Props {
  restaurant: Restaurant & { listing_images?: { url: string | null; alt_text: string | null; is_primary: boolean }[] }
  showScore?: boolean
}

function getPrimaryImage(r: Props['restaurant']) {
  const imgs = r.listing_images ?? []
  const primary = imgs.find(i => i.is_primary) ?? imgs[0]
  return primary?.url ?? null
}

export default function RestaurantCard({ restaurant: r, showScore = true }: Props) {
  const ss = STATUS_STYLE[r.status] ?? STATUS_STYLE.active
  const imageUrl = getPrimaryImage(r)

  return (
    <Link href={`/restaurants/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article
        style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', height: '100%', transition: 'box-shadow .15s' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,93,38,.12)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        {/* Image or emoji fallback */}
        <div style={{ height: 160, position: 'relative', background: '#FEF0EA', overflow: 'hidden' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={r.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }} aria-hidden="true">
              {r.emoji}
            </div>
          )}
          {/* Status badge overlay */}
          <div style={{ position: 'absolute', top: 10, right: 10, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
            {ss.label}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
            📍 {r.area_label} · {r.price_tier} · avg ₹{r.avg_spend}
          </div>

          {/* Cuisine tags */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {r.cuisine_tags.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 10, background: '#f5f0eb', color: '#666', padding: '2px 8px', borderRadius: 8 }}>{t}</span>
            ))}
          </div>

          {/* Rating + score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              ⭐ {r.rating} <span style={{ color: '#aaa', fontWeight: 400, fontSize: 11 }}>({r.total_reviews?.toLocaleString()})</span>
            </span>
            {showScore && (
              <span style={{ fontSize: 11, color: C.coral, fontWeight: 600 }}>AI {r.intelligence_score}</span>
            )}
          </div>

          {showScore && (
            <div style={{ marginTop: 8, height: 3, background: '#f0ebe5', borderRadius: 3 }}
              role="progressbar" aria-valuenow={r.intelligence_score} aria-valuemin={0} aria-valuemax={100} aria-label="AI Intelligence Score">
              <div style={{ height: '100%', borderRadius: 3, background: C.coral, width: `${r.intelligence_score}%`, transition: 'width .3s' }} />
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
