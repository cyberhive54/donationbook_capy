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
  other_data?: Record<string, any>;
  requires_user_password: boolean;
  user_password?: string;
  user_password_updated_at?: string;
  admin_password?: string;
  admin_password_updated_at?: string;
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
