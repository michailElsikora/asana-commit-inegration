const core = require("@actions/core");
const github = require("@actions/github");
const asana = require("asana");

async function writeComment(asanaClient, taskId, comment) {
  try {
    await asanaClient.tasks.findById(taskId);
  } catch (error) {
    core.setFailed("Asana task not found: " + error.message);
    return;
  }

  try {
    await asanaClient.tasks.addComment(taskId, {
      text: comment,
    });
    core.info(`Added the commit link the Asana task ${taskId}.`);
  } catch (error) {
    core.setFailed("Unable to add comment to task");
    return;
  }
}

function extractTaskID(commitMessage) {
  const regex = new RegExp(
    "ASANA: (https:\\/\\/app\\.asana\\.com\\/(\\d+)\\/(?<project>\\d+)\\/(?<task>\\d+).*?)",
    "gm"
  );

  let m;

  while ((m = regex.exec(commitMessage)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (m.groups.task) {
      return m.groups.task;
    }
  }
  return null;
}

async function processCommit(asanaClient, commit) {
  core.info("Processing commit ", commit.url);
  const taskId = extractTaskID(commit.message);
  if (taskId) {
    writeComment(asanaClient, taskId, "Referenced by: " + commit.url);
  } else {
    core.notice(`No Asana task URL provided in commit message.`);
  }
}

async function main() {
  if (!process.env.TEST && github.context.eventName !== "push") {
    core.setFailed(
      "Action must be triggered with push event. It is " +
        github.context.eventName
    );
    return;
  }
  const pushPayload = github.context.payload;

  const commits =
    process.env.COMMITS != null
      ? JSON.parse(process.env.COMMITS)
      : [pushPayload.head_commit];
  if (!Array.isArray(commits) || !commits.length) {
    core.setFailed("Unable to read commits from event");
    return;
  }

  const asanaPAT = process.env.ASANAPAT || core.getInput("asana-pat");
  if (!asanaPAT) {
    core.setFailed("Asana access token not found!");
    return;
  }

  const asanaClient = asana.Client.create({
    defaultHeaders: { "asana-enable": "new-sections,string_ids" },
    logAsanaChangeWarnings: false,
  }).useAccessToken(asanaPAT);
  if (!asanaClient) {
    core.setFailed("Unable to establish an Asana API client");
    return;
  }

  for (const commit of commits) {
    processCommit(asanaClient, commit);
  }
}

try {
  main();
} catch (error) {
  core.setFailed(error.message);
}
