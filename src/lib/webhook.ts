import { DiscourseApi } from "@/api";
import express, { Response } from "express";
import bodyParser from "body-parser";
import EventEmitter from "eventemitter3";
import { BasicUser, Uploads } from "@/types/discourse";
import { BasicChatMessage } from "./chat";

export type WebhookCallbackFunction<T> = (
  body: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: Response<any, Record<string, any>>
) => void;

/**
 * Specially, the `"default"` event will be triggered when the incoming event *is not* registered in any `on` function.
 * And the `"all"` event will be triggered in every webhook event.
 * @todo More event names are waiting to be added
 */
export interface WebhookEvents {
  post: WebhookCallbackFunction<WebhookPost>;
  chat_message: WebhookCallbackFunction<WebhookChatMessage>;
  default: WebhookCallbackFunction<any>;
  all: WebhookCallbackFunction<any>;
  ping: WebhookCallbackFunction<any>;
  [key: string | symbol]: WebhookCallbackFunction<any>;
}

/**
 * A simple receiver that receives webhooks sent from discourse
 */
export class WebhookReceptor extends EventEmitter {
  private _api: DiscourseApi;
  private _app = express();

  /**
   * The express application used by webhook. You can use it to add unencapsulated custom operations
   */
  get app() {
    return this._app;
  }

  get api() {
    return this._api;
  }

  constructor(api: DiscourseApi) {
    super();
    this._api = api;
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.on("ping", (body, res) => {
      console.log(body);
      res.json({ text: "200 ok", ec: 200 });
    });
    this.on("default", (body, res) => {
      console.log(body);
      res.json({ text: "200 ok", ec: 200 });
    });
  }

  /**
   * Allow post requests on the specified path
   * @param path
   * @param method
   */
  registWebhookPath(
    path: string
  ) {
    this.app.post(path, (req, res) => {
      try {
        const query = req.body;
        for (const hook in query) {
          this.emit("all", query, res);
          if (this.listenerCount(hook) > 0) {
            this.emit(hook, query[hook], res);
          } else {
            this.emit("default", query, res);
          }
        }
      } catch (err) {
        console.log("-------ERROR IN WEBHOOK-------");
        console.error(err);
        console.log("-------ERROR IN WEBHOOK-------");
        if (err instanceof Error) {
          res.status(500).json({ text: "500 error", details: err.message });
        } else {
          res.status(500).json({ text: "500 error", details: err });
        }
      }
    });
  }

  /**
   * Open webhook receptor
   * @param port The port
   * @returns
   */
  startWebhook(port: number = 80) {
    return new Promise((res, rej) => {
      try {
        this.app.listen(port, () => res("ok"));
      } catch (error) {
        rej(error);
      }
    });
  }

  /**
   * It is triggered when discourse sends an webhook event.
   *
   * Example
   *
   * ```
   * api.webhook.on("post", (post, res) => {
   *   console.log(post.raw);
   *   res.json({"text": "200 ok"});
   * })
   * ```
   *
   * Specially, the `"default"` event will be triggered when the incoming event *is not* registered in any `on` function.
   * And the `"all"` event will be triggered in every webhook event.
   *
   *
   * @param eventName
   * @param callback
   */
  on<T extends keyof WebhookEvents>(eventName: T, callback: WebhookEvents[T]) {
    return super.on(eventName.toString(), callback);
  }
}

export interface WebhookPost {
  id: number;
  name: string | null;
  username: string;
  avatar_template: string;
  created_at: string;
  cooked: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number: number | null;
  quote_count: number;
  incoming_link_count: number;
  reads: number;
  score: number;
  topic_id: number;
  topic_slug: number;
  topic_title: string;
  category_id: number;
  display_username: string;
  primary_group_name: null | string;
  flair_name: null | string;
  flair_group_id: null | number;
  version: number;
  user_title: null | string;
  bookmarked?: boolean;
  raw: string;
  moderator: boolean;
  admin: boolean;
  staff: boolean;
  user_id: number;
  hidden: boolean;
  trust_level: 1;
  deleted_at: null | string;
  user_deleted: boolean;
  edit_reason: null | string;
  wiki: boolean;
  reviewable_id: null | number;
  reviewable_score_count: number;
  reviewable_score_pending_count: number;
  topic_posts_count: number;
  topic_filtered_posts_count: number;
  /**
   * @todo Don't know if it's private message
   */
  topic_archetype: "regular" | string;
  category_slug: string;
}

export interface WebhookChatMessage {
  message: {
    id: number;
    message: string;
    cooked: string;
    created_at: string;
    excerpt: string;
    chat_channel_id: string;
    deleted_at?: string;
    deleted_by_id?: number;
    mentioned_users: unknown[];
    available_flags: unknown[];
    user: {
      id: number;
      username: string;
      name: string | null;
      avatar_template: string;
      moderator: boolean;
      admin: boolean;
      staff: boolean;
      new_user: boolean;
      primary_group_name?: string;
      status?: {
        description: string;
        emoji: string;
        ends_at: null | string;
        message_bus_last_id?: number;
      };
    };
    chat_webhook_event: null | unknown;
    uploads: Uploads[];
    edited?: boolean;
    in_reply_to?: {
      id: number;
      cooked: string;
      excerpt: string;
      user: BasicUser;
      chat_webhook_event: null | unknown;
    };
  };
  channel: {
    id: number;
    allow_channel_wide_mentions: boolean;
    /**
     * The Chatable associated with the chat channel
     * @beta I don’t know if there will be `chatable` other than `"Category"`.
     * @todo add other `chatable` s
     */
    chatable: {
      id: number;
      name: string;
      color: string | null;
      text_color: string | null;
      slug: string;
      topic_count: number;
      post_count: number;
      position: number;
      description: string;
      description_text: string;
      description_excerpt: string;
      topic_url: string;
      read_restricted: boolean;
      permission: null | unknown;
      notification_level: null | unknown;
      topic_template: null | unknown;
      has_children: null | unknown;
      sort_order: null | unknown;
      sort_ascending: null | unknown;
      show_subcategory_list: boolean;
      num_featured_topics: number;
      default_view: null | unknown;
      subcategory_list_style: string;
      default_top_period: string;
      default_list_filter: string;
      minimum_required_tags: number;
      navigate_to_first_post_after_read: boolean;
      uploaded_logo: null | string;
      uploaded_logo_dark: null | string;
      uploaded_background: null | string;
    };
    chatable_id: number;
    chatable_type: "Category" | string;
    chatable_url: string;
    description: string;
    title: string;
    slug: string;
    status: "open" | string;
    memberships_count: number;
    current_user_membership: unknown;
    meta: unknown;
    threading_enabled: false;
    last_message: BasicChatMessage;
  };
}
