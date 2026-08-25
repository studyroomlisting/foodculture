'use client'
import PublicProfilePage from '@/components/live/PublicProfilePage'
export default function Page({ params }: { params: { username: string } }) { return <PublicProfilePage username={params.username} /> }
