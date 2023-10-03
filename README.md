# node-discourse-api

**Unofficial** Node version of discourse api

![build status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/build_check.yml/badge.svg)
![doc status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/tsdoc.yml/badge.svg)
![lint status](https://github.com/Lhcfl/node-discourse-api/actions/workflows/lint_check.yml/badge.svg)

[Home page](https://github.com/Lhcfl/node-discourse-api)

[Api document](https://lhcfl.github.io/node-discourse-api/)

## How to use

```typescript
const { DiscourseApi } = require("node-discourse-api");

const api = new DiscourseApi("https://discourse.example.con");

api.options.api_username = "API_USERNAME";
api.options.api_key = "API_KEY";

api.createTopicPostPM({
  raw: "This is a post from node-discourse-api!!!",
  title: "Hello world!!!",
});
```
