// Auto-generated types matching FoodCulture AI Supabase schema

export interface Zone {
  id: string
  name: string
  trend_score: number
  created_at: string
}

export interface Restaurant {
  id: string
  slug: string
  name: string
  emoji: string
  zone_id: string | null
  area_label: string | null
  cuisine_tags: string[]
  price_tier: string | null
  avg_spend: number | null
  rating: number
  total_reviews: number
  intelligence_score: number
  intelligence_score_trend: number
  status: 'active' | 'viral' | 'rising' | 'new'
  open_until: string | null
  peak_hours: string | null
  ai_brief: string | null
  created_at: string
  updated_at: string
  // joined fields
  zone?: Zone
}

export interface Dish {
  id: string
  name: string
  emoji: string
  trend_label: string | null
  restaurant_count: number
  created_at: string
}

export interface Influencer {
  id: string
  slug: string
  name: string
  handle: string
  avatar_initials: string | null
  bio: string | null
  platform: 'instagram' | 'youtube' | 'both'
  followers_count: number
  impact_score: number
  engagement_rate: number
  trust_score: number
  fake_follower_pct: number
  visits_driven_weekly: number
  avg_views: number
  response_time_label: string | null
  active_cities: string[]
  cuisine_tags: string[]
  connection_fee: number
  rank_this_week: number | null
  created_at: string
  // joined
  pricing_tiers?: InfluencerPricingTier[]
  recent_posts?: InfluencerRestaurantPost[]
}

export interface InfluencerPricingTier {
  id: string
  influencer_id: string
  tier_name: string
  description: string | null
  price: number
  is_popular: boolean
}

export interface InfluencerRestaurantPost {
  id: string
  influencer_id: string
  restaurant_id: string
  caption: string | null
  views: number
  likes: number
  comments: number
  visits_driven: number
  posted_at: string
  // joined
  restaurant?: Restaurant
  influencer?: Influencer
}

export interface Deal {
  id: string
  restaurant_id: string
  code: string
  title: string
  description: string | null
  savings_label: string | null
  color_theme: 'orange' | 'green' | 'purple'
  expires_at: string | null
  active: boolean
  created_at: string
  // joined
  restaurant?: Restaurant
}

export interface Review {
  id: string
  restaurant_id: string
  reviewer_name: string
  rating: number
  body: string
  verified_visit: boolean
  created_at: string
}

export interface ConnectionRequest {
  id: string
  influencer_id: string | null
  restaurant_name: string
  requester_name: string
  collab_interest: string | null
  status: 'pending' | 'accepted' | 'declined'
  fee_charged: number | null
  created_at: string
}

export interface ActivityFeedItem {
  id: string
  restaurant_id: string | null
  influencer_id: string | null
  message: string
  dot_color: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string | null
  title: string
  body: string | null
  icon: string
  read: boolean
  link_page: string | null
  created_at: string
}

// Supabase Database shape (for createClient generic)
export interface Database {
  public: {
    Tables: {
      zones: { Row: Zone; Insert: Partial<Zone>; Update: Partial<Zone> }
      restaurants: { Row: Restaurant; Insert: Partial<Restaurant>; Update: Partial<Restaurant> }
      dishes: { Row: Dish; Insert: Partial<Dish>; Update: Partial<Dish> }
      influencers: { Row: Influencer; Insert: Partial<Influencer>; Update: Partial<Influencer> }
      influencer_pricing_tiers: { Row: InfluencerPricingTier; Insert: Partial<InfluencerPricingTier>; Update: Partial<InfluencerPricingTier> }
      influencer_restaurant_posts: { Row: InfluencerRestaurantPost; Insert: Partial<InfluencerRestaurantPost>; Update: Partial<InfluencerRestaurantPost> }
      deals: { Row: Deal; Insert: Partial<Deal>; Update: Partial<Deal> }
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> }
      connection_requests: { Row: ConnectionRequest; Insert: Partial<ConnectionRequest>; Update: Partial<ConnectionRequest> }
      activity_feed: { Row: ActivityFeedItem; Insert: Partial<ActivityFeedItem>; Update: Partial<ActivityFeedItem> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
    }
  }
}

// ─── New tables from migration_002 ───────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  city: string
  role: 'visitor' | 'owner' | 'admin'
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string
  description: string | null
  restaurant_count: number
  created_at: string
}

export interface Location {
  id: string
  zone_id: string | null
  name: string
  slug: string
  description: string | null
  restaurant_count: number
  created_at: string
  zone?: Zone
}

export interface SavedListing {
  id: string
  user_id: string
  restaurant_id: string
  created_at: string
  restaurant?: Restaurant
}

export interface ListingClaim {
  id: string
  restaurant_id: string
  claimant_id: string
  status: 'pending' | 'approved' | 'rejected'
  evidence_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Enquiry {
  id: string
  restaurant_id: string
  sender_name: string
  sender_email: string
  sender_phone: string | null
  message: string
  status: 'new' | 'read' | 'replied' | 'spam'
  replied_at: string | null
  created_at: string
}

export interface ReviewReport {
  id: string
  review_id: string
  reporter_id: string | null
  reason: string
  status: 'pending' | 'actioned' | 'dismissed'
  reviewed_by: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  metadata: Record<string, any>
  ip_address: string | null
  created_at: string
}

export interface OnboardingProgress {
  id: string
  user_id: string
  step_profile_complete: boolean
  step_listing_created: boolean
  step_images_uploaded: boolean
  step_listing_submitted: boolean
  step_approved: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ListingImage {
  id: string
  restaurant_id: string
  storage_path: string
  url: string | null
  alt_text: string | null
  is_primary: boolean
  sort_order: number
  uploaded_by: string | null
  created_at: string
}
