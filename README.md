# shellgei-slack-app

ShellGeiBot in Slack

![running example](_images/ngram-example.png)

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

## Create `.env` file

```sh
cp .env.example .env
```

Edit `.env` file and replace with your Slack Bot Token & Signing Secret.

## Deploy to AWS Lambda

Export AWS credentials.

```sh
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

Deploy AWS Lambda Function.

```sh
npm run bootstrap # only first time
npm run deploy
```

## Create Slack App

Create Slack App for your Slack Workspace.
Use this manifest.yaml.
You will need replace url section with your deployed stack output.

```yaml:manifest-example
_metadata:
  major_version: 1
  minor_version: 1
display_information:
  name: shellgei_app
  description: ShellGeiBot in Slack https://twitter.com/minyoruminyon
  background_color: "#242424"
features:
  bot_user:
    display_name: ShellGeiBot
    always_online: false
  slash_commands:
    - command: /shellgei
      url: https://abcd12345.execute-api.<your-aws-region>.amazonaws.com/prod/slack/events
      description: run shellgei. practice here https://websh.jiro4989.com/
      usage_hint: help
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
      - users.profile:read
      - files:write
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

## Create slack channnel to upload images

Create public slack channnel named `$IMG_SHARE_SLACK_CHAN`.
Then, invite **shellgei_app** to the channel.

## Limitation

- Does not have WRITE permission, but `/tmp`
- The directory `/media` is not supported
- **shebang** is not supported
- Cannot use process substitution: `<()` or `>()`
- `$TERM=dumb`
- Likely appears `/shellgei failed with the error "operation_timeout"`
  - To avoid this error, set `$AWS_LAMBDA_PROVISIONED_CONCURRENT_EXECUTIONS` >= 1 (This will cost much more)
