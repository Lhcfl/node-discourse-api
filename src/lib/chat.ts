import { DiscourseApi } from '@/discourse';
import { Uploads } from '@/types/discourse';

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
  api: DiscourseApi;

  constructor(api: DiscourseApi) {
    this.api = api;
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
    return this.api._request(`/chat/${channelId}`, 'POST', data);
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
      'PUT',
      data,
    );
  }

  /**
   * Delete a message from a channel
   * @param channelId The id of channel
   * @param messageId The id of message to delete
   * @returns
   */
  deleteMessage(channelId: number, messageId: number) {
    return this.api._request(
      `/chat/api/channels/${channelId}/messages/${messageId}`,
      'DELETE',
    );
  }
}
