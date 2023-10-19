const cp = require("child_process");
const fs = require("fs");

const autofix = async (cmdList) => {
  console.log("Autofixing...");

  process.env.PATH = `${process.env.PATH};./node_modules/.bin`;

  const failedList = [];

  for (cmd of cmdList) {
    try {
      console.log(`> ${cmd}`);
      cp.execSync(cmd, {
        stdio: "inherit",
      });
    } catch (err) {
      failedList.push(cmd);
    }
  }

  if (failedList.length > 0) {
    console.log(
      `\nAutofix failed with ${failedList.length} problems. Please fix them manually\n`,
    );
    process.exit(1);
  } else {
    try {
      fs.rmSync("dev-log/test-suggestions.sh");
    } catch (err) {}
    process.exit(0);
  }
};

module.exports = autofix;

let autofixCommands = [];

try {
  autofixCommands = fs
    .readFileSync("dev-log/test-suggestions.sh")
    .toString()
    .split("\n");
} catch (err) {
  autofixCommands = [
    'echo "nothing to fix, try using default configuration..."',
    "prettier -w .",
    "eslint . --fix --ext .ts,.js",
  ];
}

autofix(autofixCommands);
