import { DiscourseApi } from "@/discourse";

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
  api: DiscourseApi;
  app = express();

  EVENT_DICT: {
    [key in string]: WebhookCallbackFunction;
  };

  constructor(api: DiscourseApi) {
    this.api = api;
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
  registWebhookPath(path: string, method:'POST' | 'GET' = 'POST') {
    if (method === 'GET') {
      this.app.get(path, (req, res) => {
        try {
          const query = req.body;
          for (const type in query) {
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
    } else {
      this.app.post(path, (req, res) => {
        try {
          const query = req.body;
          for (const type in query) {
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
   *
   * @param eventName
   * @param callback
   */
  on(eventName: string, callback: WebhookCallbackFunction) {
    this.EVENT_DICT[eventName] = callback;
  }
}
