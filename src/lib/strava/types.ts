export interface StravaTokenResponse {
  token_type: string;
  expires_at: number; // unix seconds
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete?: { id: number };
}

export interface StravaActivitySummary {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  start_date: string; // ISO
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  type: string;
}

export interface StravaStreamSet {
  time?: { data: number[] };
  distance?: { data: number[] };
  heartrate?: { data: number[] };
  velocity_smooth?: { data: number[] };
}
