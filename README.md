# link-asana-commit-gh-action

We often want to submit code that refers to tasks in Asana.

This action links a Github commit with an Asana task as provided by the commit's message. If users provide an Asana task URL as described below, this action will post a comment on the given task with the URL of the git commit.

## Inputs

## `asana-pat`

**Required** The Asana Personal Access Token (PAT). See https://asana.com/guide/help/api/api.

## Example usage

Setup a Github Action:

```
name: LinkCommitToAsanaTask

on:
  push:
    branches: [ main ]

jobs:
  linkAsana:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Link to Asana
      uses: michailElsikora/asana-commit-inegration@1.1
      with:
        asana-pat: <Your Asana Private Token>

```

Then, commit with a message that contains the text:

```
TASK: <Your Asana task URL>
```
