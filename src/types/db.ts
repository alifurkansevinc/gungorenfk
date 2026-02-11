export type FanLevel = {
  id: number;
  name: string;
  slug: string;
  min_points: number;
  sort_order: number;
  description: string | null;
  target_store_spend: number | null;
  target_tickets: number | null;
  target_donation: number | null;
};

export type City = {
  id: number;
  name: string;
  plate_no: number;
};

export type District = {
  id: number;
  city_id: number;
  name: string;
};

export type Neighbourhood = {
  id: number;
  district_id: number;
  name: string;
};

export type FanProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  memleket_city_id: number;
  residence_city_id: number;
  residence_district_id: number | null;
  residence_neighbourhood_id: number | null;
  birth_year: number | null;
  email: string;
  fan_level_id: number;
  points: number;
  favorite_player_id: string | null;
  store_spend_total: number;
  match_tickets_count: number;
  donation_total: number;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  opponent_name: string;
  home_away: "home" | "away";
  venue: string | null;
  match_date: string;
  competition: string | null;
  season: string | null;
  goals_for: number | null;
  goals_against: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SquadMember = {
  id: string;
  name: string;
  shirt_number: number | null;
  position: string | null;
  position_category: string | null;
  photo_url: string | null;
  bio: string | null;
  sort_order: number;
  is_active: boolean;
  is_captain: boolean;
};

export type BoardMember = {
  id: string;
  name: string;
  role_slug: string;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type TechnicalStaffMember = {
  id: string;
  name: string;
  role_slug: string;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
};

export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Memleket bazında taraftar sayısı (Anadolu Temsilcisi bar için) */
export type MemleketCount = {
  city_id: number;
  city_name: string;
  count: number;
};
