# node-discourse-api

**Unofficial**, Discourse Api wrapper for Node

This package is a **work in progress** and a large number of features are still under development. If you need to add functionality, please pull request to add a new method, or use `api._request` to request any API endpoint.

[![build status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/build.yml/badge.svg)](https://www.npmjs.com/package/node-discourse-api)
[![doc status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/tsdoc.yml/badge.svg)](https://lhcfl.github.io/node-discourse-api/)
![lint status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/lint_check.yml/badge.svg)

[Home page](https://github.com/Lhcfl/node-discourse-api)

[API documentation](https://lhcfl.github.io/node-discourse-api/)

## Development Progress

❌: Not started yet  
🟩: Work in progress  
✅: Completed

| API              | Progress |
| ---------------- | -------- |
| Backups          | ❌       |
| Badges           | ❌       |
| Categories       | ❌       |
| Groups           | ❌       |
| Invites          | ❌       |
| Notifications    | ✅       |
| Posts            | ✅       |
| Topics           | 🟩       |
| Private Messages | ❌       |
| Search           | ❌       |
| Site             | ✅       |
| Tags             | ❌       |
| Uploads          | 🟩       |
| Users            | ❌       |
| Admin            | ❌       |
| Chat             | 🟩       |
| Webhook          | 🟩       |

## How to use

### Installation

```
npm install node-discourse-api
```

### Example

#### Start

```javascript
const { DiscourseApi } = require("node-discourse-api");

const api = new DiscourseApi("https://discourse.example.com");

// API configured by Discourse administrator. You can also leave it unset and have the API read only the public content of your forum.
api.options.api_username = "API_USERNAME";
api.options.api_key = "API_KEY";
```

#### Create a topic, Post a reply

```javascript
// Create a new topic, then print it to console
api
  .createTopicPostPM({
    raw: "This is a post from node-discourse-api!!!",
    title: "Hello world!!!",
  })
  .then((post) => {
    console.log(post);
  });
// Post a reply
api.createTopicPostPM({
  raw: "This is a reply post from node-discourse-api!!!",
  topic_id: 1,
});
// Reply to a post
api.createTopicPostPM({
  raw: "This is a reply of reply from node-discourse-api!!!",
  topic_id: 1,
  reply_to_post_number: 2,
});
// Handling errors
api
  .createTopicPostPM({
    raw: "This reply cannot be sent",
    topic_id: -123,
  })
  .catch((err) => {
    console.log("Catched a error");
    console.error(err);
  });
```

#### Send a message in channel

```javascript
// Send a message in channel 2. Probably, it's #general
api.chat.sendMessage(2, "hello, world!");
```

### Generate user api key

```javascript
const { DiscourseApi } = require("node-discourse-api");

const api = new DiscourseApi("https://discourse.example.com");

const generated = api.generateUserApiKeySync();

console.log(
  "Please visit the following URL authorization and paste the generated key in the console:",
);
console.log(generated.url);

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(`Paste key: `, (key) => {
  const decrypted = api.decryptUserApiKey(generated.private_key, key);
  console.log(decrypted);

  api.options.user_api_key = decrypted.key;

  api.createTopicPostPM({
    raw: "This is a post from node-discourse-api!!!",
    title: "Hello world!!!",
  });

  readline.close();
});
```

For more examples, see the [API documentation](https://lhcfl.github.io/node-discourse-api/)
