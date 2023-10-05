/**
 * The uploads from server
 *
 * *Example:*
 *
 * ```json
 * {
 *     "id": 2973,
 *     "url": "https://discourse.example/uploads/default/original/2X/4/436ccd13b6e46397a792d51fbef445380b1cc1d3.jpeg",
 *     "original_filename": "photo_2023-05-28_17-35-00.jpg",
 *     "filesize": 122190,
 *     "width": 640,
 *     "height": 640,
 *     "thumbnail_width": 500,
 *     "thumbnail_height": 500,
 *     "extension": "jpeg",
 *     "short_url": "upload://9Ct5W75p3SHRlq6I3TfD1OaFEdR.jpeg",
 *     "short_path": "/uploads/short-url/9Ct5W75p3SHRlq6I3TfD1OaFEdR.jpeg",
 *     "retain_hours": null,
 *     "human_filesize": "119 KB",
 *     "dominant_color": "67545B"
 * }
 * ```
 */
export type Uploads = {
  /**
   * Uploads unique id
   */
  id: number;
  url: string;
  original_filename: string;
  filesize: number;
  width?: number;
  height?: number;
  thumbnail_width?: number;
  thumbnail_height?: number;
  /**
   * file extension
   */
  extension: string;
  short_url: string;
  short_path: string;
  human_filesize: string;
  dominant_color?: string;
  retain_hours?: number | null;
} & {
  [key in string]: unknown;
};

/**
 * Post type
 */
export type Post = {
  id: number;
  name: string | null;
  username: string;
  avatar_template: string;
  created_at: string;
  raw?: string;
  cooked: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number: string | null;
  quote_count: number;
  incoming_link_count: number;
  reads: number;
  readers_count: number;
  score: number;
  yours: boolean;
  topic_id: number;
  topic_slug: string;
  display_username: string | null;
  primary_group_name: string | null;
  flair_name: string | null;
  flair_url: string | null;
  flair_bg_color: string | null;
  flair_color: string | null;
  flair_group_id?: string | null;
  version: number;
  can_edit: boolean;
  can_delete: boolean;
  can_recover: boolean;
  can_see_hidden_post?: boolean;
  can_wiki: boolean;
  user_title: string | null;
  bookmarked: boolean;
  actions_summary: unknown[];
  moderator: boolean;
  admin: boolean;
  staff: boolean;
  user_id: number;
  draft_sequence: number;
  hidden: boolean;
  trust_level: number;
  deleted_at: string | null;
  user_deleted: boolean;
  edit_reason: string | null;
  can_view_edit_history: boolean;
  wiki: boolean;
  reviewable_id: string | null;
  reviewable_score_count: number;
  reviewable_score_pending_count: number;
  mentioned_users: unknown[];
};
