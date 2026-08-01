export type UserRole = 'family' | 'citizen' | 'police' | 'admin';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type MissingStatus = 'active' | 'found' | 'closed';

export type FoundStatus = 'unidentified' | 'identified' | 'reunited';

export type MatchStatus = 'pending' | 'confirmed' | 'rejected';

export type LocationLevel = 'country' | 'state' | 'district' | 'city';

export type NotificationType = 'match' | 'status_update' | 'approval' | 'system';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  badge_number: string;
  department: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  level: LocationLevel;
  parent_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface MissingPerson {
  id: string;
  reporter_id: string;
  full_name: string;
  age: number | null;
  gender: string;
  photo_url: string;
  last_seen_location_id: string | null;
  last_seen_address: string;
  last_seen_date: string;
  description: string;
  status: MissingStatus;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  last_seen_location?: Location;
}

export interface FoundPerson {
  id: string;
  reporter_id: string;
  photo_url: string;
  found_location_id: string | null;
  found_address: string;
  found_date: string;
  description: string;
  status: FoundStatus;
  matched_missing_person_id: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  found_location?: Location;
}

export interface FaceMatch {
  id: string;
  found_person_id: string;
  missing_person_id: string;
  confidence_score: number;
  match_rank: number;
  status: MatchStatus;
  created_at: string;
  missing_person?: MissingPerson;
  found_person?: FoundPerson;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  report_type: 'missing' | 'found' | 'match' | 'reunification';
  reference_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  reporter?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor?: Profile | null;
}
