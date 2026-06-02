export interface User {
  id: string;
  name: string;
  email?: string;
  history?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  avatar_url?: string;
  is_mentor?: number;
  hide_location?: number;
  hide_history?: number;
  is_admin?: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  is_felony_friendly: number;
  posted_by: string;
  created_at: string;
}

export interface Housing {
  id: string;
  name: string;
  type: string;
  location: string;
  contact_info: string;
  description: string;
  posted_by: string;
  created_at: string;
}

export interface Kite {
  id: string;
  sender_id: string;
  from: string;
  content: string;
  time: string;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  sender_id: string;
  unread_count: number;
}

export interface ThreadMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  sender_name: string;
  is_read: number;
  read_at: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  link: string;
  is_read: number;
  timestamp: string;
}

export interface Resource {
  id: string;
  title: string;
  category: "mental_health" | "parole" | "ua" | "self_help";
  description: string;
  phone?: string;
  url?: string;
}

export interface ParoleOfficer {
  id: string;
  user_id: string;
  name: string;
  agency: string;
  phone: string;
  district: string;
}

export interface Thread {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
  timestamp: string;
  reply_count: number;
}

export interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  content: string;
  timestamp: string;
}

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  mentor_name: string;
  mentee_name: string;
  status: 'pending' | 'active' | 'completed' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface AppDocument {
  id: string;
  title: string;
  category: string;
  file_name: string;
  file_type: string;
  created_at: string;
}
