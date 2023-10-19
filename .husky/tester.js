const cp = require("child_process");
const fs = require("fs");

let endproc = 0;
let doexit;
const fin = new Promise((res) => (doexit = res));

function addColor(str) {
  return str.replace(/\[[^\]]+\]/g, (tip) => {
    return (
      {
        "[error]": "[\x1b[31merror\x1b[0m]",
        "[warn]": "[\x1b[33mwarn\x1b[0m]",
      }[tip] || tip
    );
  });
}

function writelog(filename, ...args) {
  if (!fs.existsSync("dev-log")) {
    fs.mkdirSync("dev-log");
  }
  fs.writeFileSync(`dev-log/${filename}`, ...args);
}

/**
 * test
 * @param {String[]} cmdList commands list
 */
const fastTester = async (cmdList, cmdDetails) => {
  console.log("Start checking...");

  process.env.PATH = `${process.env.PATH};./node_modules/.bin`;

  const procList = cmdList.map(startProc);
  const totproc = procList.length;

  /**
   * @param {string} cmd
   */
  function startProc(cmd) {
    const proc = cp.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`[\x1b[31mCHECK FAILED\x1b[0m] ${cmd}\n-------------`);
        console.error(addColor(stdout));
        console.error(addColor(stderr));
        for (const p of procList) p.kill();
        if (cmdDetails[cmd].suggestion) {
          console.log(
            `-------------\nSuggestion: ${cmdDetails[cmd].suggestion}\n Or run yarn autofix to fix problems above according to suggestions.\n`,
          );
          writelog("test-suggestions.sh", cmdDetails[cmd].suggestion);
        }
        doexit(1);
      } else {
        console.log(`[\x1b[32mSUCCESS\x1b[0m] ${cmd}`);
        if (++endproc === totproc) doexit(0);
      }
    });
    return proc;
  }

  process.exit(await fin);
};

const fullTester = async (cmdList, cmdDetails) => {
  console.log("Start checking...");

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
    writelog(
      "test-suggestions.sh",
      failedList.map((cmd) => cmdDetails[cmd].suggestion).join("\n"),
    );
    console.log(
      `\nCheck failed with ${failedList.length} problems. Here is the suggestions:`,
    );
    for (failedCmd of failedList) {
      if (cmdDetails[failedCmd].suggestion) {
        console.log(`[${failedCmd}]: ${cmdDetails[failedCmd].suggestion}`);
      }
    }
    console.log(
      "\n Or run yarn autofix to fix problems above according to suggestions.\n",
    );
    process.exit(1);
  } else {
    process.exit(0);
  }
};

const tester = async (fast, ...args) => {
  if (fast) {
    return await fastTester(...args);
  } else {
    return await fullTester(...args);
  }
};

module.exports = tester;

if (process.argv) {
  const list = fs.readdirSync(".husky/list");
  cmdList = {};
  let fast = false;
  for (test of process.argv) {
    if (test === "-f" || test === "--fast") {
      fast = true;
    }
    if (list.includes(`${test}.js`)) {
      require(`./list/${test}.js`).forEach((cmd) => {
        cmdList[cmd.cmd] = cmd;
      });
    }
  }
  if (Object.keys(cmdList).length === 0) {
    console.log("nothing to test, are you serious?");
  }
  tester(fast, Object.keys(cmdList), cmdList);
}
