'use client'
import { useEffect, useRef, useState } from 'react'
import { uploadListingImage, deleteListingImage, getListingImages } from '@/lib/storage'

const C = { coral: '#E85D26', green: '#2E9E55', border: '#ede8e2' }

interface Props {
  restaurantId: string
}

interface ImageRecord {
  id: string
  url: string | null
  storage_path: string
  is_primary: boolean
}

export default function ImageUploader({ restaurantId }: Props) {
  const [images, setImages]     = useState<ImageRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getListingImages(restaurantId).then(imgs => setImages(imgs as ImageRecord[]))
  }, [restaurantId])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true); setError('')

    for (const file of Array.from(files)) {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
        setError('Only JPG, PNG, or WebP images are supported'); continue
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Max file size is 10MB'); continue
      }
      const isPrimary = images.length === 0
      const result = await uploadListingImage(restaurantId, file, isPrimary)
      if (result) {
        setImages(prev => [...prev, {
          id: Date.now().toString(),
          url: result.url,
          storage_path: result.path,
          is_primary: isPrimary,
        }])
      }
    }
    setUploading(false)
  }

  async function handleDelete(img: ImageRecord) {
    await deleteListingImage(img.id, img.storage_path)
    setImages(prev => prev.filter(i => i.id !== img.id))
  }

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        Photos <span style={{ fontWeight: 400, color: '#aaa' }}>({images.length}/10)</span>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.coral }}
        onDragLeave={e => { e.currentTarget.style.borderColor = C.border }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.border; handleFiles(e.dataTransfer.files) }}
        style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', marginBottom: 14, transition: 'border-color .2s' }}
        role="button" aria-label="Upload photos" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        {uploading ? (
          <div style={{ color: C.coral, fontSize: 14 }}>Uploading…</div>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop photos here or click to upload</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>JPG, PNG, WebP · Max 10MB · Up to 10 photos</div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
        style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
          {images.map(img => (
            <div key={img.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${img.is_primary ? C.coral : C.border}`, aspectRatio: '1' }}>
              {img.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="Listing photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              {img.is_primary && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: C.coral, color: '#fff', fontSize: 9, fontWeight: 600, textAlign: 'center', padding: '2px 0' }}>
                  COVER
                </div>
              )}
              <button onClick={() => handleDelete(img)} aria-label="Delete photo"
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
