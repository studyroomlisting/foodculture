export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

const CUISINES = [
  { id: 'biryani',       name: 'Biryani',       category: 'Indian',    emoji: '🍛' },
  { id: 'south-indian',  name: 'South Indian',  category: 'Indian',    emoji: '🥘' },
  { id: 'north-indian',  name: 'North Indian',  category: 'Indian',    emoji: '🍲' },
  { id: 'street-food',   name: 'Street Food',   category: 'Indian',    emoji: '🌮' },
  { id: 'seafood',       name: 'Seafood',        category: 'Indian',    emoji: '🦞' },
  { id: 'mughlai',       name: 'Mughlai',       category: 'Indian',    emoji: '🍖' },
  { id: 'gujarati',      name: 'Gujarati',      category: 'Indian',    emoji: '🥗' },
  { id: 'chettinad',     name: 'Chettinad',     category: 'Indian',    emoji: '🌶️' },
  { id: 'cafes',         name: 'Cafes',         category: 'Beverages', emoji: '☕' },
  { id: 'fine-dining',   name: 'Fine Dining',   category: 'Premium',   emoji: '🍷' },
  { id: 'desserts',      name: 'Desserts',      category: 'Sweet',     emoji: '🍰' },
  { id: 'bakery',        name: 'Bakery',        category: 'Sweet',     emoji: '🥐' },
  { id: 'burgers',       name: 'Burgers',       category: 'Fast Food', emoji: '🍔' },
  { id: 'pizza',         name: 'Pizza',         category: 'Fast Food', emoji: '🍕' },
  { id: 'sushi',         name: 'Sushi',         category: 'Japanese',  emoji: '🍱' },
  { id: 'chinese',       name: 'Chinese',       category: 'Asian',     emoji: '🥢' },
  { id: 'thai',          name: 'Thai',          category: 'Asian',     emoji: '🍜' },
  { id: 'mediterranean', name: 'Mediterranean', category: 'Western',   emoji: '🫒' },
  { id: 'healthy',       name: 'Healthy',       category: 'Health',    emoji: '🥙' },
  { id: 'vegan',         name: 'Vegan',         category: 'Health',    emoji: '🥦' },
]

export async function GET() {
  return NextResponse.json({ data: CUISINES, count: CUISINES.length }, { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } })
}
