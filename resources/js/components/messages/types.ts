export interface UserSummary {
  id: number;
  name: string;
  avatar?: string;
}

export type ContactRole = 'tutor' | 'student';

export interface ContactUser extends UserSummary {
  role: ContactRole;
}

export interface ParticipantThread {
  partner: UserSummary;
  latest_message_at: string;
  unread_count: number;
}

export interface AdminThread {
  id: string;
  tutor: UserSummary;
  student: UserSummary;
  latest_message_at: string;
  unread_count: number;
}

export type Thread = ParticipantThread | AdminThread;

export interface Message {
  id: number;
  tutor_id: number;
  user_id: number;
  sender_id?: number | null;
  content?: string;
  body?: string;
  sent_at?: string;
  created_at?: string;
  is_read?: boolean;
}

export interface PaginatedMessages {
  data: Message[];
  [key: string]: unknown;
}

export interface ParticipantActiveThread {
  partner: UserSummary;
  messages: PaginatedMessages;
}

export interface AdminActiveThread {
  tutor: UserSummary;
  student: UserSummary;
  messages: PaginatedMessages;
}

export type ActiveThread = ParticipantActiveThread | AdminActiveThread;
