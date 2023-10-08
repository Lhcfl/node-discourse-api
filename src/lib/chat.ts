import { DiscourseApi } from "@/api";
import { Uploads } from "@/types/discourse";

export type ChatMessageOptions = {
  /**
   * Reply to message id
   */
  in_reply_to_id?: number;
  /**
   * An array of uploads_ids
   */
  uploads?: Uploads[] | { id: number }[];
};

export class ChatApi {
  private _api: DiscourseApi;

  get api() {
    return this._api;
  }

  constructor(api: DiscourseApi) {
    this._api = api;
  }

  /**
   * Send a message to channel
   * @param channelId The id of channel
   * @param message message raw text
   * @todo Uploads is currently unavailable
   * @param uploads if set, will bring uploads
   * @returns
   */
  sendMessage(
    channelId: number,
    message: string,
    options?: ChatMessageOptions,
  ) {
    const data: { [key: string]: unknown } = {
      message,
    };
    if (options?.uploads) {
      data.upload_ids = options.uploads.map((upload) => {
        return upload.id;
      });
    }
    if (options?.in_reply_to_id) {
      data.in_reply_to_id = options.in_reply_to_id;
    }
    return this.api._request(`/chat/${channelId}`, "POST", data);
  }

  /**
   * Edit a message of a channel
   * @param channelId The id of channel
   * @param messageId The id of message
   * @param message new message, raw text
   * @param uploads if set, will bring uploads
   * @returns
   */
  editMessage(
    channelId: number,
    messageId: number,
    message: string,
    options?: ChatMessageOptions,
  ) {
    const data: { [key: string]: unknown } = {
      new_message: message,
    };
    if (options?.uploads) {
      data.upload_ids = options.uploads.map((upload) => {
        return upload.id;
      });
    }
    if (options?.in_reply_to_id) {
      data.in_reply_to_id = options.in_reply_to_id;
    }
    return this.api._request(
      `/chat/${channelId}/edit/${messageId}`,
      "PUT",
      data,
    );
  }

  /**
   * Delete a message from a channel
   * 
   * Example:
   * 
   * ```
   * api.chat.deleteMessage(1, 1024).then(() => {
   *   console.log("Delete successfully");
   * }).catch((err) => {
   *   console.log("Delete failed!");
   *   console.error(err);
   * });
   * ```
   * 
   * @param channelId The id of channel
   * @param messageId The id of message to delete
   * @returns
   */
  deleteMessage(channelId: number, messageId: number) {
    return this.api._request(
      `/chat/api/channels/${channelId}/messages/${messageId}`,
      "DELETE",
    );
  }
}

export interface BaseChatMessage {
  id: number;
  message: string;
  cooked: string;
  created_at: string;
  excerpt: string;
  deleted_at: null | string;
  deleted_by_id: null | number;
  thread_id: null | number;
  chat_channel_id: number;
}