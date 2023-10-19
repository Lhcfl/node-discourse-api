import EventEmitter from "eventemitter3";
import {
  BasicTopic,
  BasicUser,
  Notifications,
  Post,
  SuggestedTopic,
  Topic,
  Uploads,
  UserInfo,
} from "@/types/discourse";
import axios from "axios";
import { ChatApi } from "@/lib/chat";
import crypto from "node:crypto";
import { WebhookReceptor } from "./lib/webhook";
import fs from "fs";
import { AxiosError } from "axios";

export class DiscoureError extends Error implements DiscoureBaseError {
  code?: string;
  axiosMessage?: string;
  message: string;
  status: number;
  statusText: string;
  response?: AxiosError["response"];
  request?: AxiosError["request"];
  body: unknown;
  axiosToJSON?: AxiosError["toJSON"];
  constructor(errobj: DiscoureBaseError | AxiosError) {
    super();
    this.name = "DiscouseError";
    if (errobj instanceof AxiosError) {
      if (!errobj.response) {
        throw new Error(
          "DiscourseError constructed from AxiosError must have a response",
        );
      }
      this.axiosMessage = errobj.message;
      this.axiosToJSON = errobj.toJSON;
      this.message = errobj.message;
      this.response = errobj.response;
      this.status = errobj.response.status;
      this.statusText = errobj.response.statusText;
      this.body = errobj.response.data;
      if (errobj.request) this.request = errobj.request;
      if (errobj.code) this.code = errobj.code;
      if (
        errobj.response.data &&
        typeof errobj.response.data === "object" &&
        "errors" in errobj.response.data
      ) {
        if (
          errobj.response.data.errors &&
          typeof errobj.response.data.errors === "object" &&
          "join" in errobj.response.data.errors &&
          typeof errobj.response.data.errors.join === "function"
        ) {
          this.message += ": " + errobj.response.data.errors.join(";");
        } else {
          this.message += ": " + JSON.stringify(errobj.response.data.errors);
        }
      }
    } else {
      Object.assign(this, errobj);
      this.name = "DiscouseError";
      this.status = errobj.status;
      this.message = errobj.message;
      this.statusText = errobj.statusText;
    }
  }
}

export class DiscourseApiOption {
  private _storage: ApiOptions;
  api: DiscourseApi;

  private checkCompatibility() {
    if (
      (this.api_key || this.api_username) &&
      (this.user_api_key || this.user_api_client_id)
    ) {
      throw "You cannot specify api_key and user_api_key at the same time";
    }
  }

  constructor(api: DiscourseApi, options?: ApiOptions) {
    this.api = api;
    if (options) {
      this._storage = options;
    } else {
      this._storage = {};
    }
    this.checkCompatibility();
  }

  /**
   * Api username
   */
  get api_username(): string | undefined {
    return this._storage.api_username;
  }
  set api_username(str: string) {
    this._storage.api_username = str;
    this.checkCompatibility();
  }
  /**
   * Api key
   */
  get api_key(): string | undefined {
    return this._storage.api_key;
  }
  set api_key(str: string) {
    this._storage.api_key = str;
    this.checkCompatibility();
  }
  /**
   * User Api
   */
  get user_api_key(): string | undefined {
    return this._storage.user_api_key;
  }
  set user_api_key(str: string) {
    this._storage.user_api_key = str;
    this.checkCompatibility();
  }
  /**
   * User Api Client id
   */
  get user_api_client_id(): string | undefined {
    return this._storage.user_api_client_id;
  }
  set user_api_client_id(str: string) {
    this._storage.user_api_client_id = str;
    this.checkCompatibility();
  }
}

class DiscourseApi extends EventEmitter {
  private _chat: ChatApi;
  private _options: DiscourseApiOption;
  private _webhook: WebhookReceptor;
  /**
   * The URL of discourse site
   */
  url: string;

  /**
   * The discourse api's options
   */
  get options() {
    return this._options;
  }
  set options(newOpt: ApiOptions) {
    this._options = new DiscourseApiOption(this, newOpt);
  }

  /**
   * Chat Api
   */
  get chat() {
    return this._chat;
  }

  /**
   * Webhook receptor
   */
  get webhook() {
    return this._webhook;
  }

  /**
   * Provide one `axios` to use
   * @see {@link https://github.com/axios/axios}
   */
  get _axios() {
    return axios;
  }

  /**
   * Create a api client
   * @param url The URL of your site. Don't add / at the end
   * @param options options
   */
  constructor(url: string, options?: ApiOptions) {
    super();
    this.url = url;
    this._options = new DiscourseApiOption(this, options);
    this._chat = new ChatApi(this);
    this._webhook = new WebhookReceptor(this);
  }

  /**
   * Get default header
   */
  get _defaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.options.api_key) {
      headers["Api-Key"] = this.options.api_key;
    }
    if (this.options.api_username) {
      headers["Api-Username"] = this.options.api_username;
    }
    if (this.options.user_api_key) {
      headers["User-Api-Key"] = this.options.user_api_key;
    }
    if (this.options.user_api_client_id) {
      headers["User-Api-Client-Id"] = this.options.user_api_client_id;
    }
    return headers;
  }

  /**
   * send request easily
   * @param endpoint the endpoint. if the endpoint not starts with '/', we consider it as a url
   * @param method method. defaltly 'GET'
   * @param data for "POST" and "PUT": request payload. For "GET" and "DELETE": URLSearchParams
   * @returns Promise
   */
  _request(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
    data?: unknown | FormData | URLSearchParams,
    options?: {
      /**
       * When true, we will not automatically add the end of .json when fetching
       */
      doNotAddJSON?: boolean;
      /**
       * custom header
       */
      headers?: Record<string, string>;
      /**
       * When true, the options.header will override the default headers. Otherwise, the request will use a header that is a combination of the two
       */
      overrideHeaders?: boolean;
      /**
       * URL Params
       */
      params?: unknown | URLSearchParams;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let headers: Record<string, string>;
      if (!options) options = {};
      if (options.overrideHeaders) {
        headers = options.headers || {};
      } else {
        headers = Object.assign({}, this._defaultHeaders, options?.headers);
      }
      if (data instanceof URLSearchParams) {
        options.params = data;
        data = undefined;
      } else if (data instanceof FormData) {
        if (headers && "Content-Type" in headers) {
          delete headers["Content-Type"];
        }
      }
      if (endpoint.startsWith("/")) {
        const [p1, p2] = endpoint.split("?");
        let urlType = "";
        if (!p1.endsWith(".json") && !options?.doNotAddJSON) {
          urlType = ".json";
        }
        if (p2) {
          endpoint = `${p1}${urlType}?${p2}`;
        } else {
          endpoint = `${p1}${urlType}`;
        }
      }
      axios({
        method,
        headers,
        url: endpoint,
        baseURL: this.url,
        params: options?.params,
        data,
      })
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          if (err instanceof AxiosError && err.response) {
            reject(new DiscoureError(err));
          } else {
            reject(err);
          }
        });
      //   fetch(endpoint, {
      //     method,
      //     body: data,
      //     headers,
      //   })
      //     .then((res) => {
      //       if (res.ok) {
      //         res.text().then((str) => {
      //           try {
      //             resolve(JSON.parse(str));
      //           } catch (err) {
      //             resolve(str);
      //           }
      //         });
      //       } else {
      //         res.text().then((str) => {
      //           try {
      //             reject({
      //               status: res.status,
      //               statusText: res.statusText,
      //               body: JSON.parse(str),
      //             });
      //           } catch (err) {
      //             reject({
      //               status: res.status,
      //               statusText: res.statusText,
      //               body: str,
      //             });
      //           }
      //         });
      //       }
      //     })
      //     .catch((err) => {
      //       reject(err);
      //     });
    });
  }

  /**
   * Generate a user api key.
   * It might be slow if you don't provide a private key because this function will generate it!
   *
   * Usage:
   *
   * ```javascript
   * api.generateUserApiKeySync
   * ```
   *
   * @see {@link https://meta.discourse.org/t/user-api-keys-specification/48536}
   *
   * @param params params
   * @returns
   */
  generateUserApiKeySync(params?: generateUserApiKeyParams): UserApiKeyLink {
    const urlParams = new URLSearchParams();
    const res: {
      url: string;
      public_key?: string;
      private_key?: string;
      nonce: string;
    } = {
      url: "",
      nonce: crypto.randomBytes(16).toString("hex"),
    };
    if (!params) {
      params = {};
    }
    urlParams.set(
      "application_name",
      params.application_name || "NodeDiscourseApi",
    );
    urlParams.set("scopes", params.scopes || "read");
    urlParams.set("client_id", params.client_id || "NodeDiscourseApi");
    if (!params.public_key) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: "pkcs1",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs1",
          format: "pem",
        },
      });
      urlParams.set("public_key", publicKey);
      res.private_key = privateKey;
      res.public_key = publicKey;
    } else {
      urlParams.set("public_key", params.public_key);
    }

    if (params.auth_redirect) {
      urlParams.set("auth_redirect", params.auth_redirect);
    }
    if (params.push_url) {
      urlParams.set("push_url", params.push_url);
    }
    urlParams.set("nonce", res.nonce);
    res.url = `${this.url}/user-api-key/new?${urlParams.toString()}`;
    return res;
  }

  /**
   * Asynchronously generate a user api key.
   *
   * It is the async version of `generateUserApiKeySync`.
   *
   * @see {@link https://meta.discourse.org/t/user-api-keys-specification/48536}
   *
   * @param params params
   */
  async generateUserApiKey(params?: generateUserApiKeyParams) {
    return this.generateUserApiKeySync(params);
  }

  /**
   * Decrypt the encrypted user_api_key from discourse
   * @param private_key your private_key
   * @param encrypted The encrypted user_api_key
   * @returns
   */
  decryptUserApiKey(
    private_key: string,
    encrypted: string,
  ): {
    /**
     * The user api key
     */
    key: string;
    /**
     * The nonce provided when generating user_api_key
     */
    nonce: string;
    push: boolean;
    /**
     * Api version
     */
    api: string | number;
  } {
    return JSON.parse(
      crypto
        .privateDecrypt(
          {
            key: private_key,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          Buffer.from(encrypted, "base64"),
        )
        .toString(),
    );
  }

  /**
   * Revoke a user api key.
   * @param user_api_key The user api key to revoke. If not specified, options.user_api_key is used
   */
  revokeUserApiKey(user_api_key?: string) {
    if (!user_api_key) {
      user_api_key = this.options.user_api_key;
    }
    if (!user_api_key) {
      throw "No user api key to revoke";
    }
    return this._request("/user-api-key/revoke", "POST", undefined, {
      headers: {
        "User-Api-Key": user_api_key,
      },
      overrideHeaders: true,
    });
  }

  /**
   * Get the info of site.
   *
   * @see {@link https://docs.discourse.org/#tag/Site/operation/getSite}
   */
  getSite() {
    return this._request("/site");
  }

  /**
   * List latest posts across topics
   *
   * @see {@link https://docs.discourse.org/#tag/Posts/operation/listPosts}
   */
  listPosts(): Promise<{
    latest_posts: Post[];
  }> {
    return this._request("/posts");
  }

  /**
   * Get the latest topics. It is an alias of `listLatest`
   * @see {@link listLatest}
   */
  getLatest(...args: never[]) {
    return this.listLatest(...args);
  }

  /**
   * Get the latest topics
   * @param options
   * @returns
   */
  listLatest(options?: {
    /**
     * You can usually provide `more_topics_url`
     * If you provide this value, you cannot provide other options
     */
    custom_url?: string;
    order?:
      | "default"
      | "created"
      | "activity"
      | "views"
      | "posts"
      | "category"
      | "likes"
      | "op_likes"
      | "posters";
    ascending?: boolean;
    status?:
      | "deleted"
      | "closed"
      | "listed"
      | "open"
      | "public"
      | "unlisted"
      | "archived";
  }): Promise<{
    topic_list: {
      more_topics_url?: string;
      can_create_topic: boolean;
      per_page: number;
      topics: SuggestedTopic;
    };
    flair_groups?: {
      id: number;
      name?: string;
      flair_url: string;
      flair_bg_color: string;
      flair_color: string;
    };
    primary_groups: unknown[];
    users: BasicUser[];
  }> {
    const urlParams = new URLSearchParams();
    if (options?.order) {
      urlParams.append("order", options.order);
    }
    if (options?.ascending) {
      urlParams.append("order", String(options.ascending));
    }
    if (options?.status) {
      urlParams.append("order", String(options.status));
    }
    const queryUrl = options?.custom_url || "/latest";
    if (!options?.custom_url && urlParams.toString()) {
      return this._request(`${queryUrl}?${urlParams.toString()}`);
    } else {
      return this._request(queryUrl);
    }
  }

  /**
   * Get information on a specified topic. It is a alias of `getTopic`
   * @param topic_id
   * @param args
   * @returns
   * @see {@link getTopic}
   */
  getTopicInfo(topic_id: number | string, ...args: never[]) {
    return this.getTopic(topic_id, ...args);
  }

  /**
   * Get information on a specified topic
   * @param topic_id
   * @param config.arround_post_number
   * @returns
   * @see {@link https://docs.discourse.org/#tag/Topics/operation/getTopic}
   */
  getTopic(
    topic_id: number | string,
    config?: {
      /**
       * Get the post stream near the post number
       */
      arround_post_number?: number | "last";
    },
  ): Promise<Topic> {
    if (config?.arround_post_number) {
      return this._request(`/t/-/${topic_id}/${config?.arround_post_number}`);
    } else {
      return this._request(`/t/${topic_id}`);
    }
  }

  /**
   * Get posts by post_id on a specified topic
   * @param topic_id
   * @param post_ids
   * @returns
   */
  getTopicPosts(
    topic_id: number | string,
    post_ids: Array<number | string>,
  ): Promise<{
    id: number;
    post_stream: {
      posts: Post[];
    };
  }> {
    const urlParams = new URLSearchParams();
    for (const pid of post_ids) {
      urlParams.append("post_ids[]", pid.toString());
    }
    return this._request(`/t/${topic_id}/posts?${urlParams.toString()}`);
  }

  /**
   * Get the raw of the specified post
   * @param post_id
   * @returns
   */
  getPostRaw(post_id: number | string): Promise<string> {
    return this._request(`/posts/${post_id}/raw`);
  }

  /**
   * Get *only* the cooked of the specified post
   * @param post_id
   * @returns
   */
  getPostCooked(post_id: number | string): Promise<{
    cooked: string;
  }> {
    return this._request(`/posts/${post_id}/cooked`);
  }

  /**
   * Creates a new topic, a new post, or a private message
   *
   * @see {@link https://docs.discourse.org/#tag/Posts/operation/createTopicPostPM}
   * @param payloads payloads
   */
  createTopicPostPM(payloads: {
    /**
     * Required if creating a new topic or new private message.
     */
    title?: string;
    /**
     * Raw post
     */
    raw: string;
    /**
     * Required if creating a new post.
     */
    topic_id?: number;
    /**
     * Optional if creating a new topic, and ignored if creating a new post.
     */
    category?: number;
    /**
     * Required for private message, comma separated.
     */
    target_recipients?: string;
    /**
     * Required for new private message.
     */
    archetype?: "private_message" | string;
    /**
     * Datestring for created at
     */
    created_at?: string;
    /**
     * Optional, the post number to reply to inside a topic.
     */
    reply_to_post_number?: number;
    /**
     * Provide a URL from a remote system to associate a forum topic with that URL, typically for using Discourse as a comments system for an external blog.
     */
    embed_url?: string;
    /**
     * Provide an external_id from a remote system to associate a forum topic with that id.
     */
    external_id?: string;
  }): Promise<Post> {
    return this._request("/posts", "POST", payloads);
  }

  /**
   * Retrieve a single post
   *
   * This endpoint can be used to get the number of likes on a post using the `actions_summary` property in the response. `actions_summary` responses with the `id` of `2` signify a like. If there are no `actions_summary` items with the `id` of `2`, that means there are `0` likes. Other ids likely refer to various different flag types.
   *
   * https://docs.discourse.org/#tag/Posts/operation/getPost
   * @param id
   */
  getPost(id: number | string): Promise<Post> {
    return this._request(`/posts/${id}`);
  }

  /**
   * Update a single post
   *
   * https://docs.discourse.org/#tag/Posts/operation/updatePost
   * @param id Post id
   * @param post Edit information
   * @returns
   */
  updatePost(
    id: number | string,
    post: {
      raw: string;
      edit_reason?: string;
    },
  ): Promise<Post> {
    return this._request(`/posts/${id}`, "PUT", post);
  }

  /**
   * Delete a single post
   * https://docs.discourse.org/#tag/Posts/operation/deletePost
   *
   *
   * @param id Post id
   * @param permanently The `SiteSetting.can_permanently_delete` needs to be enabled first before this param can be used. Also this endpoint needs to be called first without `permanently` and then followed up with a second call 5 minutes later with p`ermanently ` to permanently delete.
   *
   */
  deletePost(id: number | string, permanently: boolean = false) {
    return this._request(`/posts/${id}`, "DELETE", {
      force_destory: permanently,
    });
  }

  /**
   * List replies to a post
   *
   * https://docs.discourse.org/#tag/Posts/operation/postReplies
   * @param id Post id
   */
  getPostReplies(id: number | string): Promise<Post[]> {
    return this._request(`/posts/${id}`);
  }

  /**
   * Perform a post action, like a post and other actions
   *
   * https://docs.discourse.org/#tag/Posts/operation/performPostAction
   * @param post_id
   * @param post_action_type_id The post action type. See https://github.com/discourse/discourse/blob/main/app/models/post_action_type.rb
   * - `2` - like
   * - `3` - off_topic
   * - `4` - inappropriate
   * - `6` - notify_user
   * - `7` - notify_moderators
   * - `8` - spam
   * @returns The updated post
   */
  performPostAction(
    post_id: number | string,
    post_action_type_id: number,
    flag_topic?: boolean,
  ): Promise<Post> {
    return this._request("/post_actions", "POST", {
      id: post_id,
      post_action_type_id,
      flag_topic,
    });
  }

  /**
   * Like a post
   * @param post_id
   * @returns The updated post
   */
  likePost(post_id: number | string): Promise<Post> {
    return this.performPostAction(post_id, 2);
  }

  /**
   * Delete a post action, unlike a post and other actions
   *
   * https://docs.discourse.org/#tag/Posts/operation/performPostAction
   * @param post_id
   * @param post_action_type_id The post action type. See https://github.com/discourse/discourse/blob/main/app/models/post_action_type.rb
   */
  deletePostAction(
    post_id: number | string,
    post_action_type_id: number,
  ): Promise<Post> {
    return this._request(
      `/post_actions/${post_id}?post_action_type_id=${post_action_type_id}`,
      "DELETE",
    );
  }

  /**
   * Unlike a post
   * @param post_id
   * @returns The updated post
   */
  unlikePost(post_id: number | string): Promise<Post> {
    return this.deletePostAction(post_id, 2);
  }

  /**
   * Lock a post from being edited. You should provide an api that has moderator premission.
   *
   * See https://docs.discourse.org/#tag/Posts/operation/lockPost
   * @param post_id
   * @returns The updated post
   */
  lockPost(post_id: number | string): Promise<Post> {
    return this._request(`/posts/${post_id}/locked`, "PUT", {
      locked: true,
    });
  }

  /**
   * Unlokc a post that was locked from being edited. You should provide an api that has moderator premission.
   *
   * See https://docs.discourse.org/#tag/Posts/operation/lockPost
   * @param post_id
   * @returns The updated post
   */
  unlockPost(post_id: number | string): Promise<Post> {
    return this._request(`/posts/${post_id}/locked`, "PUT", {
      locked: false,
    });
  }

  /**
   * Remove a topic
   *
   * https://docs.discourse.org/#tag/Topics/operation/removeTopic
   * @param topic_id
   * @returns
   */
  removeTopic(topic_id: number) {
    return this._request(`/t/${topic_id}`, "DELETE");
  }

  /**
   * Update a topic
   *
   * https://docs.discourse.org/#tag/Topics/operation/updateTopic
   * @param topic_id
   * @param topic
   * @returns Topic updated
   */
  updateTopic(
    topic_id: number,
    topic: {
      title?: string;
      category_id?: number;
    },
  ): Promise<BasicTopic> {
    return this._request(`/t/-/${topic_id}`, "PUT", {
      topic,
    });
  }

  /**
   * Invite to topic
   *
   * https://docs.discourse.org/#tag/Topics/operation/inviteToTopic
   * @param topic_id
   * @param data
   * @returns Topic updated
   */
  inviteToTopic(
    topic_id: number,
    data: {
      user?: string;
      email?: string;
    },
  ): Promise<{
    user: BasicUser;
  }> {
    return this._request(`/t/${topic_id}/invite`, "POST", data);
  }

  /**
   * Update the status of a topic.
   *
   * https://docs.discourse.org/#tag/Topics/operation/updateTopicStatus
   *
   * @param id Topic id
   * @param status Status
   * @param enabled Enabled
   * @param until Until. Only required for `pinned` and `pinned_globally`
   * @returns
   */
  updateTopicStatus(
    id: number,
    status: "closed" | "pinned" | "pinned_globally" | "archived" | "visible",
    enabled: boolean,
    until?: string | Date,
  ): Promise<{
    success: string;
    topic_status_update?: string | null;
  }> {
    return this._request(`/t/${id}/status`, "PUT", {
      status,
      enabled,
      until,
    });
  }

  /**
   * Close a topic
   * @param id Topic id
   * @param until
   * @returns
   */
  closeTopic(id: number, until?: string | Date) {
    return this.updateTopicStatus(id, "closed", true, until);
  }
  /**
   * Open a topic
   * @param id Topic id
   * @param until
   * @returns
   */
  openTopic(id: number) {
    return this.updateTopicStatus(id, "closed", false);
  }
  /**
   * Archive a topic
   * @param id Topic id
   * @param until
   * @returns
   */
  archiveTopic(id: number, until?: string | Date) {
    return this.updateTopicStatus(id, "archived", true, until);
  }
  /**
   * Unarchive a topic
   * @param id Topic id
   * @param until
   * @returns
   */
  unarchiveTopic(id: number) {
    return this.updateTopicStatus(id, "archived", false);
  }
  /**
   * Pin a topic
   * @param id Topic id
   * @param globally
   * @param until
   * @returns
   */
  pinTopic(id: number, globally: boolean, until: string | Date) {
    if (globally) {
      return this.updateTopicStatus(id, "pinned_globally", true, until);
    } else {
      return this.updateTopicStatus(id, "pinned", true, until);
    }
  }
  /**
   * Unpin a topic
   * @param id Topic id
   * @param globally
   * @param until
   * @returns
   */
  unpinTopic(id: number, globally: boolean) {
    if (globally) {
      return this.updateTopicStatus(id, "pinned_globally", false);
    } else {
      return this.updateTopicStatus(id, "pinned", false);
    }
  }
  /**
   * Unlist a topic
   * @param id Topic id
   * @param until
   * @returns
   */
  unlistTopic(id: number, until?: string | Date) {
    return this.updateTopicStatus(id, "visible", false, until);
  }
  /**
   * List a topic. (Make the topic visible again)
   * @param id Topic id
   * @param until
   * @returns
   */
  listTopic(id: number) {
    return this.updateTopicStatus(id, "visible", true);
  }

  /**
   * Create a upload
   * @param file File path or file buffer
   * @param options
   * @returns
   * @see {@link https://docs.discourse.org/#tag/Uploads/operation/createUpload}
   */
  createUpload(
    file: fs.PathLike | Buffer,
    options?:
      | {
          type?:
            | "avatar"
            | "profile_background"
            | "card_background"
            | "custom_emoji"
            | "composer";
          /**
           * required if uploading an avatar
           */
          user_id?: number;
          /**
           * Use this flag to return an id and url
           */
          synchronous?: boolean;
          /**
           * used only if `file` is a filepath.
           */
          encoding?: BufferEncoding;
          /**
           * filename provided to discourse
           */
          filename?: string;
        }
      | FormData,
  ): Promise<Uploads> {
    let data = new FormData();
    if (options instanceof FormData) {
      data = options;
    } else {
      options = options || {};
      if (file instanceof Buffer) {
        data.append("file", new Blob([file]), options.filename);
      } else {
        data.append(
          "file",
          new Blob([
            fs.readFileSync(file, {
              encoding: options.encoding,
            }),
          ]),
          options.filename || String(file).replace(/^.*[\\\/]/, ""),
        );
      }
      data.append("type", options.type || "composer");
      if (options.user_id) data.append("user_id", String(options.user_id));
      data.append("synchronous", String(options.synchronous || true));
    }
    return this._request("/uploads", "POST", data);
  }

  /**
   * Get notifications of a user
   * @param load_more_notifications more notifications url
   * @see {@link https://docs.discourse.org/#tag/Notifications/operation/getNotifications}
   */
  getNotifications(load_more_notifications?: string): Promise<Notifications> {
    return this._request(load_more_notifications || "/notifications");
  }

  /**
   * Mark notifications as read
   * @param id (optional) Leave off to mark all notifications as read
   * @see {@link https://docs.discourse.org/#tag/Notifications/operation/markNotificationsAsRead}
   */
  markNotificationsAsRead(id?: number): Promise<{
    success?: string;
  }> {
    return this._request("/notifications/mark-read", "PUT", {
      id,
    });
  }

  /**
   * Get a user by username
   * @param username
   * @returns info of user
   */
  getUser(username: string): Promise<UserInfo> {
    return this._request(`/u/${username}`);
  }
}

export default DiscourseApi;
export { DiscourseApi };

export type UserApiKeyLink = {
  /**
   * A link that allows the user to generate a User API key. The user should visit this link, explicitly agree to the authorization, and then copy the content it produces and provide it to `api.decryptUserApiKey` to obtain the User API key. Alternatively, if `auth_redirect` has the correct value, discourse will redirect to `auth_redirect` url after user authorization.
   */
  url: string;
  /**
   * Uhe nonce generated. It can be used to verify and identify its source after decrypting the user api key.
   */
  nonce: string;
  /**
   * If you don't provide public_key then we generate it and return it here.
   */
  public_key?: string;
  /**
   * If you don't provide public_key then we generate it and return it here.
   */
  private_key?: string;
};

export type ApiOptions = {
  /**
   * Api username
   */
  api_username?: string;
  /**
   * Api key
   */
  api_key?: string;
  /**
   * User Api Key
   */
  user_api_key?: string;
  /**
   * User Api Client Id
   */
  user_api_client_id?: string;
};

export type generateUserApiKeyParams = {
  /**
   * the name of the application making the request (will be displayed in the user account’s Apps tab)
   * @defaultValue `"NodeDiscourseApi"`
   */
  application_name?: string;
  /**
   * url to redirect back to with the generated token
   */
  auth_redirect?: string;
  /**
   * comma-separated list of access scopes allowed for the key, see `allow user api key scopes` for the full list of available scopes
   *
   * @defaultValue `"read"`
   */
  scopes?: string;
  /**
   * a unique identifier for the client
   * @defaultValue `"NodeDiscourseApi"`
   */
  client_id?: string;
  /**
   * url to push notifications to (required and valid only if `push` or `notifications` are included in the scopes)
   */
  push_url?: string;
  /**
   * the public part of the keypair generated by the client
   */
  public_key?: string;
};

export interface DiscoureBaseError {
  /**
   * Http status code
   */
  status: number;
  /**
   * Http status text
   */
  statusText: string;
  /**
   * error message
   */
  message: string;
}
