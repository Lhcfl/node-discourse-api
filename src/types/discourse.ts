/**
 * The uploads from server
 *
 * *Example:*
 *
 * ```json
 * {
 *     id: 2973,
 *     url: "https://discourse.example/uploads/default/original/2X/4/436ccd13b6e46397a792d51fbef445380b1cc1d3.jpeg",
 *     original_filename: "photo_2023-05-28_17-35-00.jpg",
 *     filesize: 122190,
 *     width: 640,
 *     height: 640,
 *     thumbnail_width: 500,
 *     thumbnail_height: 500,
 *     extension: jpeg,
 *     short_url: "upload://9Ct5W75p3SHRlq6I3TfD1OaFEdR.jpeg",
 *     short_path: "/uploads/short-url/9Ct5W75p3SHRlq6I3TfD1OaFEdR.jpeg",
 *     retain_hours: null,
 *     human_filesize: "119 KB",
 *     dominant_color: "67545B"
 * }
 * ```
 */
export interface Uploads {
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
  retain_hours: number | null;
  human_filesize: string;
  dominant_color?: string | null;
}

/**
 * Post type
 */
export interface Post {
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
}

export interface PostAction {
  id: number;
  count: number;
  hidden: boolean;
  can_act: boolean;
}

export interface SuggestedTopic {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  highest_post_number: number;
  image_url: string;
  created_at: string;
  last_posted_at: string;
  bumped: boolean;
  bumped_at: string;
  archetype: string;
  unseen: boolean;
  pinned: boolean;
  unpinned: string;
  excerpt: string;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  bookmarked: boolean;
  liked: string;
  tags: unknown[] | string[];
  tags_descriptions: unknown;
  like_count: number;
  views: number;
  category_id: number;
  featured_link: string;
  posters: [
    {
      extras: string;
      description: string;
      user: {
        id: number;
        username: string;
        name: string;
        avatar_template: string;
      };
    },
  ];
}

/**
 * Topic
 */
export interface Topic extends BasicTopic {
  post_stream: {
    posts: Post[];
    stream: number[];
  };
  timeline_lookup: unknown[];
  suggested_topics: SuggestedTopic[];
  tags: unknown[] | string[];
  tags_descriptions: unknown;
  id: number;
  title: string;
  fancy_title: string;
  posts_count: number;
  created_at: string;
  views: number;
  reply_count: number;
  like_count: number;
  last_posted_at: string;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  has_summary: boolean;
  archetype: string;
  slug: string;
  category_id: number;
  word_count: number;
  deleted_at: string;
  user_id: number;
  featured_link: string;
  pinned_globally: boolean;
  pinned_at: string;
  pinned_until: string;
  image_url: string;
  slow_mode_seconds: number;
  draft: string;
  draft_key: string;
  draft_sequence: number;
  unpinned: string;
  pinned: boolean;
  current_post_number?: number;
  highest_post_number: number;
  deleted_by: string;
  has_deleted: boolean;
  actions_summary: PostAction[];
  chunk_size: number;
  bookmarked: boolean;
  bookmarks: unknown[];
  topic_timer: string;
  message_bus_last_id: number;
  participant_count: number;
  show_read_indicator: boolean;
  thumbnails: string;
  slow_mode_enabled_until: string;
  summarizable: boolean;
  details: {
    can_edit: boolean;
    notification_level: number;
    can_move_posts: boolean;
    can_delete: boolean;
    can_remove_allowed_users: boolean;
    can_create_post: boolean;
    can_reply_as_new_topic: boolean;
    can_invite_to?: boolean;
    can_invite_via_email?: boolean;
    can_flag_topic?: boolean;
    can_convert_topic: boolean;
    can_review_topic: boolean;
    can_close_topic: boolean;
    can_archive_topic: boolean;
    can_split_merge_topic: boolean;
    can_edit_staff_notes: boolean;
    can_toggle_topic_visibility: boolean;
    can_pin_unpin_topic: boolean;
    can_moderate_category: boolean;
    can_remove_self_id: 0;
    participants?: [
      {
        id: 0;
        username: string;
        name: string;
        avatar_template: string;
        post_count: 0;
        primary_group_name: string;
        flair_name: string;
        flair_url: string;
        flair_color: string;
        flair_bg_color: string;
        flair_group_id?: string;
        admin: boolean;
        moderator: boolean;
        trust_level: 0;
      },
    ];
    created_by: {
      id: 0;
      username: string;
      name: string;
      avatar_template: string;
    };
    last_poster: {
      id: 0;
      username: string;
      name: string;
      avatar_template: string;
    };
  };
}

export interface BasicUser {
  id: number;
  username: string;
  name: string | null;
  avatar_template: string;
}

export interface BasicTopic {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
}

export interface Notification {
  id?: number;
  user_id?: number;
  notification_type?: number;
  read?: boolean;
  created_at?: string;
  post_number?: string;
  topic_id?: number;
  fancy_title?: string;
  slug?: string;
  high_priority?: boolean;
  data?: {
    badge_id?: number;
    badge_name?: string;
    badge_slug?: string;
    badge_title?: boolean;
    username?: string;
  };
}
/**
 * @see {@link https://docs.discourse.org/#tag/Notifications/operation/getNotifications}
 */
export interface Notifications {
  notifications?: Notification[];
  total_rows_notifications?: number;
  seen_notification_id?: number;
  load_more_notifications?: string;
}
