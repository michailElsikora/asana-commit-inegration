const process = require("process");
const cp = require("child_process");
const path = require("path");

const testCommits = [
  {
    message:
      "ASANA: https://app.asana.com/0/1202171625399129/1202344768195453/f",
    url: "https://github.com/eithanshavit/asana-link-commit-gh-action/commit/d13cc7bb35480794489ecc3c502db961bfd57492",
  },
];

test("test runs", () => {
  process.env["COMMITS"] = JSON.stringify(testCommits);
  if (!process.env.ASANAPAT) {
    throw new Error(
      "ASANAPAT env var should be provided with a valid private access token"
    );
  }
  process.env["TEST"] = 1;
  const fileToRun = path.join(__dirname, "dist/index.js");
  const result = cp
    .execSync(`node ${fileToRun}`, { env: process.env })
    .toString();
  console.log(result);
});
