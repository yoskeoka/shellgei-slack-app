# shellgei-slack-app

ShellGeiBot in Slack

## Requirements

- Node.js (>= v16)
- Docker
- An AWS Account comes with the role can create...
  - Lambda Function
  - API Gateway
  - CloudFormation Stack

## Install

```sh
npm i
```

## Create Slack App

```yaml:manifest-example
_metadata:
  major_version: 1
  minor_version: 1
display_information:
  name: shellgei_app
  description: ShellGeiBot in Slack https://twitter.com/minyoruminyon
  background_color: "#242324"
features:
  bot_user:
    display_name: ShellGeiBot
    always_online: false
  slash_commands:
    - command: /shellgei
      url: https://5s6sd7r7y4.execute-api.ap-northeast-1.amazonaws.com/prod/slack/events
      description: run shellgei. practice here https://websh.jiro4989.com/
      usage_hint: help
      should_escape: false
    - command: /shellgei-dryrun
      url: https://5s6sd7r7y4.execute-api.ap-northeast-1.amazonaws.com/prod/slack/events
      description: run shellgei, but result appears only to you.
      usage_hint: cowsay for i in $(seq 0 3); do matsuya; done
      should_escape: false
oauth_config:
  scopes:
    bot:
      - commands
      - chat:write
      - chat:write.public
      - files:write
      - remote_files:write
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

## Create `.env` file

```sh
cp .env.example .env
```

Edit `.env` file and replace with your Slack Bot Token & Signing Secret.

## Create slack channnel to upload images

Create slack channnel which has the same name with the environment variable `$IMG_SHARE_SLACK_CHAN`.
Then, invite **shellgei_app** to the channel.

## Deploy to AWS Lambda

```sh
npm run bootstrap # only first time
npm run deploy
```
