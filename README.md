# link-asana-commit-gh-action

This action links a Github commit with an Asana task as provided by the commit's message.

## Inputs

## `asana-pat`

**Required** The Asana Private Access Token

## Example usage

Setup a Github Action:

```
name: AsanaTaskLink

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  linkAsana:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Link to Asana
      uses: eithanshavit/asana-github-action@v1
      with:
        asana-pat: <your Asana private token>

```

Then, commit with a message that contains the text:

```
ASANA: <your asana task URL>
```
