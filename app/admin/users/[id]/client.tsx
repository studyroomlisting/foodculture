'use client'
import AdminUserDetailPage from '@/components/live/AdminUserDetailPage'
export default function Page({ params }: { params: { id: string } }) { return <AdminUserDetailPage userId={params.id} /> }
