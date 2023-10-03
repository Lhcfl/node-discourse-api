import EventEmitter from 'eventemitter3';
import { ApiOptions, Post, generateUserApiKeyParams } from '@/types/discourse';
import fetch, { HeadersInit } from 'node-fetch-commonjs';
import { ChatApi } from '@/lib/chat';
import crypto from 'node:crypto';

export class DiscourseApiOption {
  private _storage: ApiOptions;
  api: DiscourseApi;

  private checkCompatibility() {
    if (
      (this.api_key || this.api_username) &&
      (this.user_api_key || this.user_api_client_id)
    ) {
      throw 'You cannot specify api_key and user_api_key at the same time';
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

export class DiscourseApi extends EventEmitter {
  /**
   * The URL of discourse site
   */
  url: string;
  /**
   * The discourse's options
   */
  options: DiscourseApiOption;
  /**
   * Chat Api
   */
  chat: ChatApi;

  /**
   * Create a api client
   * @param url The URL of your site. Don't add / at the end
   * @param options options
   */
  constructor(url: string, options?: ApiOptions) {
    super();
    this.url = url;
    this.options = new DiscourseApiOption(this, options);
    this.chat = new ChatApi(this);
  }

  /**
   * Get default header
   */
  get _defaultHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.options.api_key) {
      headers['Api-Key'] = this.options.api_key;
    }
    if (this.options.api_username) {
      headers['Api-Username'] = this.options.api_username;
    }
    if (this.options.user_api_key) {
      headers['User-Api-Key'] = this.options.user_api_key;
    }
    if (this.options.user_api_client_id) {
      headers['User-Api-Client-Id'] = this.options.user_api_client_id;
    }
    return headers;
  }

  /**
   * send request easily
   * @param endpoint the endpoint. if the endpoint not starts with '/', we consider it as a url
   * @param method method. defaltly 'GET'
   * @param data request payload
   * @returns Promise
   */
  _request(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' = 'GET',
    data?: unknown,
    options?: {
      /**
       * When true, we will not automatically add the end of .json when fetching
       */
      doNotSendJSON?: boolean;
      /**
       * custom header
       */
      headers?: HeadersInit;
      /**
       * When true, the options.header will override the default headers. Otherwise, the request will use a header that is a combination of the two
       */
      overrideHeaders?: boolean;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (data) {
        data = JSON.stringify(data);
      }
      if (endpoint.startsWith('/')) {
        const [p1, p2] = endpoint.split('?');
        let urlType = '';
        if (!p1.endsWith('.json') && !options?.doNotSendJSON) {
          urlType = '.json';
        }
        if (p2) {
          endpoint = `${this.url}${p1}${urlType}?${p2}`;
        } else {
          endpoint = `${this.url}${p1}${urlType}`;
        }
      }
      let headers: HeadersInit | undefined;
      if (options?.overrideHeaders) {
        headers = options.headers;
      } else {
        headers = Object.assign({}, this._defaultHeaders, options?.headers);
      }
      fetch(endpoint, {
        method,
        body: data,
        headers,
      }).then((res) => {
        if (res.ok) {
          res.text().then((str) => {
            try {
              resolve(JSON.parse(str));
            } catch (err) {
              resolve(str);
            }
          });
        } else {
          res.text().then((str) => {
            try {
              reject({
                status: res.status,
                statusText: res.statusText,
                body: JSON.parse(str),
              });
            } catch (err) {
              reject({
                status: res.status,
                statusText: res.statusText,
                body: str,
              });
            }
          });
        }
      });
    });
  }

  /**
   * Generate a user api key.
   * It might be slow if you don't provide a private key because this function will generate it!
   *
   * For more information, see https://meta.discourse.org/t/user-api-keys-specification/48536
   *
   * @param params params
   */
  generateUserApiKeySync(params?: generateUserApiKeyParams) {
    const urlParams = new URLSearchParams();
    const res: {
      url: string;
      public_key?: string;
      private_key?: string;
      nonce: string;
    } = {
      url: '',
      nonce: crypto.randomBytes(16).toString('hex'),
    };
    if (!params) {
      params = {};
    }
    urlParams.set(
      'application_name',
      params.application_name || 'NodeDiscourseApi',
    );
    urlParams.set('scopes', params.scopes || 'read');
    urlParams.set('client_id', params.client_id || 'NodeDiscourseApi');
    if (!params.public_key) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem',
        },
      });
      urlParams.set('public_key', publicKey);
      res.private_key = privateKey;
      res.public_key = publicKey;
    } else {
      urlParams.set('public_key', params.public_key);
    }

    if (params.auth_redirect) {
      urlParams.set('auth_redirect', params.auth_redirect);
    }
    if (params.push_url) {
      urlParams.set('push_url', params.push_url);
    }
    urlParams.set('nonce', res.nonce);
    res.url = `${this.url}/user-api-key/new?${urlParams.toString()}`;
    return res;
  }

  /**
   * Asynchronously generate a user api key.
   *
   * For more information, see https://meta.discourse.org/t/user-api-keys-specification/48536
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
          Buffer.from(encrypted, 'base64'),
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
      throw 'No user api key to revoke';
    }
    return this._request('/user-api-key/revoke', 'POST', undefined, {
      headers: {
        'User-Api-Key': user_api_key,
      },
      overrideHeaders: true,
    });
  }

  /**
   * Get the info of site.
   *
   * See https://docs.discourse.org/#tag/Site/operation/getSite
   */
  getSite() {
    return this._request('/site');
  }

  /**
   * List latest posts across topics
   *
   * See https://docs.discourse.org/#tag/Posts/operation/listPosts
   */
  listPosts(): Promise<{
    latest_posts: Post[];
  }> {
    return this._request('/posts');
  }

  /**
   * Creates a new topic, a new post, or a private message
   *
   * See https://docs.discourse.org/#tag/Posts/operation/createTopicPostPM
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
    archetype?: 'private_message' | string;
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
    return this._request('/posts', 'POST', payloads);
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
    return this._request(`/posts/${id}`, 'PUT', post);
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
    return this._request(`/posts/${id}`, 'DELETE', {
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
}
