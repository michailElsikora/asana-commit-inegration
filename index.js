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
    const text = `Author: ${commit.committer.name}\nCommit text: ${commit.message}\nCommit url: ${commit.url}`;
    await asanaClient.stories.createStoryForTask('1205462834331842', {text, pretty: true})
    core.info(`Added the commit link the Asana task ${taskId}.`);
  } catch (error) {
    console.log('e', error);
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

//process.env.ASANAPAT 
async function main() {
  const pushPayload = github.context.payload;
  const commitData = {
    title: pushPayload.pull_request.title,
    author: pushPayload.sender.login,
    body: pushPayload.pull_request.body,
    pullLink: pushPayload.pull_request.html_url,
    pullStatus: pushPayload.pull_request.state,
  }

  const asanaPAT = core.getInput("asana-pat");
  if (!asanaPAT) {
    core.setFailed("Asana access token not found!");
    return;
  }

  const asanaProjectId = core.getInput("asana-project");
  if (!asanaProjectId) {
    core.setFailed("Asana project id  not found!");
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

  createAsanaTask(asanaClient, asanaProjectId, commitData);
}


const createAsanaTask = async (asanaClient, asanaProjectId, commit) => {
  const text = `Сделал пулл реквест: ${commit.author}\nОписание: ${commit.body}\nСсылка на пулл реквест: ${commit.pullLink}\nСтатус пулл реквеста: ${commit.pullStatus}`;
  const task = {
    workspace: "1203322908804151",
    name: `${commit.title}`,
    resource_subtype: "default_task",
    approval_status: "pending",
    assignee_status: "later",
    completed: false,
    projects: [
      asanaProjectId
    ],
    html_notes: `<body>${text}</body>`,
    pretty: true,
  };
  try {
    await asanaClient.tasks.createTask(task)
    core.info(`Added the commit link the Asana project ${asanaProjectId}.`);
  } catch (error) {
    console.log('errorClient', error);
    core.setFailed("Unable to add comment to task");
    return;
  }
}


try {
  main();
} catch (error) {
  core.setFailed(error.message);
}
