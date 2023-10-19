module.exports = [
  {
    cmd: "eslint . --ext .ts,.js --color",
    suggestion: "yarn lint:fix",
  },
  {
    cmd: "prettier -c .",
    suggestion: "yarn pretty:fix",
  },
  {
    cmd: "tsc --pretty && tsc-alias",
  },
];
