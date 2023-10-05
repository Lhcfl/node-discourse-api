# node-discourse-api

**Unofficial**, Discourse Api wrapper for Node

![build status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/build.yml/badge.svg)
![doc status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/tsdoc.yml/badge.svg)
![lint status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/lint_check.yml/badge.svg)

[Home page](https://github.com/Lhcfl/node-discourse-api)

[API documentation](https://lhcfl.github.io/node-discourse-api/)

## How to use

### Installation

```
npm install node-discourse-api
```

### Example

#### Create a topic

```javascript
const { DiscourseApi } = require("node-discourse-api");

const api = new DiscourseApi("https://discourse.example.con");

api.options.api_username = "API_USERNAME";
api.options.api_key = "API_KEY";

api.createTopicPostPM({
  raw: "This is a post from node-discourse-api!!!",
  title: "Hello world!!!",
});
```

#### Send a message in channel

```javascript
const { DiscourseApi } = require("node-discourse-api");

const api = new DiscourseApi("https://discourse.example.con");

api.options.api_username = "API_USERNAME";
api.options.api_key = "API_KEY";

api.chat.sendMessage(1, "hello, world!");
```

For more examples, see the [API documentation](https://lhcfl.github.io/node-discourse-api/)
