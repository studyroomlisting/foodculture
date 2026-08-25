'use client'
import ListingFormPage from '@/components/live/ListingFormPage'
export default function Page({ params }: { params: { id: string } }) { return <ListingFormPage mode="edit" id={params.id} /> }
