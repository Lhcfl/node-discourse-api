import { DiscourseApi } from "@/api";

import express, { Response } from "express";
import bodyParser from "body-parser";

export type WebhookCallbackFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: Response<any, Record<string, any>>,
) => void;

/**
 * A simple receiver that receives webhooks sent from discourse
 */
export class WebhookReceptor {

  private _api: DiscourseApi;
  private _app = express();
  private EVENT_DICT: {
    [key in string]: WebhookCallbackFunction;
  };

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
    this._api = api;
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());

    this.EVENT_DICT = {
      ping: (body, res) => {
        console.log(body);
        res.json({ text: "200 ok", ec: 200 });
      },
      default: (body, res) => {
        console.log(body);
        res.json({ text: "200 ok", ec: 200 });
      },
    };
  }

  /**
   * Allow post requests on the specified path
   * @param path
   */
  registWebhookPath(path: string) {
    this.app.post(path, (req, res) => {
      try {
        const query = req.body;
        for (const type in query) {
          if (this.EVENT_DICT["all"]) {
            this.EVENT_DICT["all"](query, res);
          }
          if (this.EVENT_DICT[type]) {
            this.EVENT_DICT[type](query[type], res);
          } else {
            this.EVENT_DICT["default"](query, res);
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
  on(eventName: string, callback: WebhookCallbackFunction) {
    this.EVENT_DICT[eventName] = callback;
  }
}
