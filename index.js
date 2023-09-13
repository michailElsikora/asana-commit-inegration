const core = require("@actions/core");
const github = require("@actions/github");
const asana = require("asana");

async function writeComment(asanaClient, taskId, commit) {
  try {
    await asanaClient.tasks.findById(taskId);
  } catch (error) {
    core.setFailed("Asana task not found: " + error.message);
    return;
  }

  try {
    const html_text = `
      <body>
      Author: ${commit.committer.name}
      Commit text: ${commit.message}
      Referenced by: ${commit.url}
      </body>
    `;
    await asanaClient.stories.createStoryForTask('1205462834331842', {html_text, pretty: true})
    core.info(`Added the commit link the Asana task ${taskId}.`);
  } catch (error) {
    core.setFailed("Unable to add comment to task");
    return;
  }
}

function extractTaskID(commitMessage) {
  const regex = new RegExp(
    "TASK.+(https:\\/\\/app\\.asana\\.com\\/(\\d+)\\/(?<project>\\d+)\\/(?<task>\\d+).*?)",
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
  core.info("Processing commit " + commit.url);
  const taskId =  "1205462834331842";
  if (taskId) {
    writeComment(asanaClient, taskId, commit);
  } else {
    core.notice(`No Asana task URL provided in commit message.`);
  }
}

const AsanaPet = "1/1203956910529809:999b87579f9305e6ba0c45e4c0760160";
//process.env.ASANAPAT 
async function main() {
  if (!process.env.TEST && github.context.eventName !== "push") {
    core.setFailed(
      "Action must be triggered with push event. It is " +
        github.context.eventName
    );
    return;
  }
  const pushPayload = github.context.payload;

  let payloadCommits = pushPayload.commits;
  const commits =
    process.env.COMMITS != null
      ? JSON.parse(process.env.COMMITS)
      : payloadCommits;
  if (!Array.isArray(commits) || !commits.length) {
    core.setFailed("Unable to read commits from event");
    return;
  }

  const asanaPAT = AsanaPet || core.getInput("asana-pat");
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
