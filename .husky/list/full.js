const fs = require("fs");
const list = fs.readdirSync(".husky/list");
const cmdList = {};
for (l of list) {
  if (l === "full.js") continue;
  require(`./${l}`).forEach((cmd) => {
    cmdList[cmd.cmd] = cmd;
  });
}
module.exports = Object.keys(cmdList).map((cmd) => cmdList[cmd]);
