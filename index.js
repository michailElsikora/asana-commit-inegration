const core = require("@actions/core");
const github = require("@actions/github");
const asana = require("asana");
const archy = require("archy");

async function writeComment(asanaClient, taskId, comment) {
  try {
    const task = await asanaClient.tasks.findById(taskId);
    if (!task) {
      core.setFailed("Asana task not found!");
      return;
    }

    await asanaClient.tasks.addComment(taskId, {
      text: comment,
    });
    core.info("Added the commit link the Asana task.");
  } catch (error) {
    core.setFailed(error.message);
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
}

async function processCommit(asanaClient, commit) {
  core.info("Processing commit ", commit.url);
  const taskId = extractTaskID(commit.message);
  if (taskId) {
    writeComment(asanaClient, taskId, "Referenced by: " + commit.url);
  } else {
    core.info(`Invalid Asana task URL provided`);
  }
}

async function main() {
  core.info("github.context");
  core.info(archy(github));
  if (!process.env.TEST && github.context.event_name != "push") {
    core.setFailed("Action must be triggered with push event");
    return;
  }

  const commits =
    process.env.COMMITS != null
      ? JSON.parse(process.env.COMMITS)
      : github.context.event.commits;
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
