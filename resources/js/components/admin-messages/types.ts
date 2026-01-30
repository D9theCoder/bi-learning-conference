export interface UserSummary {
  id: number;
  name: string;
  avatar?: string;
}

export interface AdminTutorThread {
  id: string;
  admin: UserSummary;
  tutor: UserSummary;
  latest_message_at: string;
  unread_count: number;
}

export interface AdminTutorMessage {
  id: number;
  tutor_id: number;
  user_id: number;
  sender_id?: number | null;
  content?: string;
  sent_at?: string;
  created_at?: string;
  is_read?: boolean;
}

export interface PaginatedMessages {
  data: AdminTutorMessage[];
  [key: string]: unknown;
}

export interface AdminTutorActiveThread {
  admin: UserSummary;
  tutor: UserSummary;
  messages: PaginatedMessages;
}
