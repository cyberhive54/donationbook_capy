export interface Festival {
  id: string;
  code: string;
  event_name: string;
  organiser?: string;
  mentor?: string;
  guide?: string;
  location?: string;
  event_start_date?: string;
  event_end_date?: string;
  ce_start_date?: string; // Collection/Expense start date (required)
  ce_end_date?: string; // Collection/Expense end date (required)
  ce_dates_updated_at?: string;
  other_data?: Record<string, any>;
  requires_password: boolean; // Whether password is required to view
  requires_user_password: boolean; // Legacy field
  user_password?: string;
  user_password_updated_at?: string;
  admin_password?: string;
  admin_password_updated_at?: string;
  super_admin_password?: string; // New super admin password
  super_admin_password_updated_at?: string;
  theme_primary_color?: string;
  theme_secondary_color?: string;
  theme_bg_color?: string;
  theme_bg_image_url?: string;
  theme_text_color?: string;
  theme_border_color?: string;
  theme_table_bg?: string;
  theme_card_bg?: string;
  theme_dark?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BasicInfo {
  id: string;
  event_name: string;
  organiser: string;
  mentor: string;
  guide: string;
  event_date?: string;
  event_start_date?: string;
  event_end_date?: string;
  location?: string;
  other_data?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Collection {
  id: string;
  festival_id?: string;
  name: string;
  amount: number;
  group_name: string;
  mode: string;
  note?: string;
  date: string;
  time_hour?: number;
  time_minute?: number;
  image_url?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  festival_id?: string;
  item: string;
  pieces: number;
  price_per_piece: number;
  total_amount: number;
  category: string;
  mode: string;
  note?: string;
  date: string;
  time_hour?: number;
  time_minute?: number;
  image_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'collection' | 'expense';
  name: string;
  amount: number;
  group_category: string;
  mode: string;
  note?: string;
  date: string;
  time_hour?: number;
  time_minute?: number;
  created_at: string;
}

export interface Stats {
  totalCollection: number;
  totalExpense: number;
  numDonators: number;
  balance: number;
}

export interface Album {
  id: string;
  festival_id: string;
  title: string;
  description?: string;
  year?: number;
  cover_url?: string;
  created_at?: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'pdf' | 'other';

export interface MediaItem {
  id: string;
  album_id: string;
  type: MediaType;
  title?: string;
  description?: string;
  url: string;
  mime_type?: string;
  size_bytes?: number;
  duration_sec?: number;
  created_at?: string;
  thumbnail_url?: string;
}

export interface Group {
  id: string;
  name: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Mode {
  id: string;
  name: string;
  created_at?: string;
}

export interface Password {
  id: string;
  user_password: string;
  admin_password: string;
  updated_at?: string;
}

// Access Logging & Multiple Passwords System
export interface AccessLog {
  id: string;
  festival_id: string;
  visitor_name: string;
  access_method: 'password_modal' | 'direct_link';
  password_used: string | null;
  accessed_at: string;
  user_agent?: string | null;
  ip_address?: string | null;
  session_id?: string | null;
}

export interface FestivalPassword {
  id: string;
  festival_id: string;
  password: string;
  password_label?: string | null;
  is_active: boolean;
  created_at: string;
  created_by?: string | null;
  last_used_at?: string | null;
  usage_count: number;
}

export interface VisitorStats {
  festival_id: string;
  festival_code: string;
  event_name: string;
  unique_visitors: number;
  total_visits: number;
  last_visit?: string | null;
  total_visitors: number;
  last_visitor_name?: string | null;
  last_visitor_at?: string | null;
}

export interface UserSession {
  authenticated: boolean;
  date: string;
  token: string;
  visitorName: string;
  sessionId: string;
  accessMethod: 'password_modal' | 'direct_link';
  passwordUsed: string;
  loggedAt: string;
}

// Date validation and out-of-range transaction info
export interface OutOfRangeTransactions {
  collections_out_of_range: number;
  expenses_out_of_range: number;
  earliest_collection_date: string | null;
  latest_collection_date: string | null;
  earliest_expense_date: string | null;
  latest_expense_date: string | null;
}

export interface FestivalDateInfo {
  festival_id: string;
  festival_code: string;
  event_name: string;
  ce_start_date: string | null;
  ce_end_date: string | null;
  event_start_date: string | null;
  event_end_date: string | null;
  requires_password: boolean;
  has_ce_dates: boolean;
  dates_valid: boolean;
  total_collections: number;
  total_expenses: number;
  collections_out_of_range: number;
  expenses_out_of_range: number;
}
