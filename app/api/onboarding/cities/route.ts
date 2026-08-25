export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

const CITIES = [
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India', active: true },
  { id: 'mumbai',    name: 'Mumbai',    state: 'Maharashtra', country: 'India', active: false },
  { id: 'delhi',     name: 'Delhi',     state: 'Delhi',       country: 'India', active: false },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana',   country: 'India', active: false },
  { id: 'chennai',   name: 'Chennai',   state: 'Tamil Nadu',  country: 'India', active: false },
  { id: 'pune',      name: 'Pune',      state: 'Maharashtra', country: 'India', active: false },
  { id: 'kolkata',   name: 'Kolkata',   state: 'West Bengal', country: 'India', active: false },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat',     country: 'India', active: false },
]

export async function GET() {
  return NextResponse.json({ data: CITIES, count: CITIES.length }, { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } })
}
