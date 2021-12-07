# shellgei-slack-app

ShellGeiBot for SlackApp

## install

```sh
npm i
```

## create Slack App

```yaml:manifest-example
_metadata:
  major_version: 1
  minor_version: 1
display_information:
  name: shellgei_app
features:
  bot_user:
    display_name: ShellGeiBot
    always_online: false
  slash_commands:
    - command: /shellgei
      url: https://abcd12345.execute-api.<your-aws-region>.amazonaws.com/prod/slack/events
      description: run shellgei.
      usage_hint: echo hello shellgei
      should_escape: false
    - command: /shellgei-dryrun
      url: https://abcd12345.execute-api.<your-aws-region>.amazonaws.com/prod/slack/events
      description: run shellgei, but result appears only to you.
      usage_hint: cowsay for i in $(seq 0 3); do matsuya; done
      should_escape: false
oauth_config:
  scopes:
    bot:
      - commands
      - chat:write
      - chat:write.public
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

```sh
cp .env.example .env
```

edit `.env` file and replace with your Slack Bot Token & Signing Secret.

## deploy to AWS Lambda

```sh
npm run bootstrap # only first time
npm run deploy
```
