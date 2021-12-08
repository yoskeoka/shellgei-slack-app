/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './env';
import {App, ExpressReceiver, LogLevel} from '@slack/bolt';
import * as awsServerlessExpress from 'aws-serverless-express';
import {APIGatewayProxyEvent, Context} from 'aws-lambda';

const processBeforeResponse = true;

const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? '',
  processBeforeResponse,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
  processBeforeResponse,
  logLevel: LogLevel.DEBUG,
});

// mask sensitive env vars on this process
process.env.SLACK_BOT_TOKEN = '';
process.env.SLACK_SIGNING_SECRET = '';
process.env.AWS_ACCESS_KEY_ID = '';
process.env.AWS_SECRET_ACCESS_KEY = '';
process.env.AWS_SESSION_TOKEN = '';

const server = awsServerlessExpress.createServer(expressReceiver.app);
export const handler = (
  event: APIGatewayProxyEvent,
  context: Context,
): void => {
  awsServerlessExpress.proxy(server, event, context);
};

import * as util from 'util';

app.command('/shellgei', async ({command, ack, say, respond}) => {
  ack();

  const result = await execCommand(command.text);
  const sayResult = await say(formatRes(command.text, result));
  if (!sayResult.ok) {
    await respond(
      `error: '${sayResult.error}', message: '${sayResult.message}'`,
    );
  }
});

app.command('/shellgei-dryrun', async ({command, ack, respond}) => {
  ack();

  const result = await execCommand(command.text);
  await respond(formatRes(command.text, result));
});

function formatRes(cmd: string, result: string): string {
  return `> ${cmd}\n${result}`;
}

import * as childProcess from 'child_process';

async function execCommand(cmd: string): Promise<string> {
  try {
    process.chdir('/');
  } catch (e) {
    console.log(e);
  }

  return util
    .promisify(childProcess.exec)(cmd, {shell: '/bin/bash'})
    .then((result) => head(result.stdout, 15))
    .catch((e: childProcess.ExecException) => head(e.message, 15));
}

function head(s: string, n: number): string {
  return s.split('\n').slice(0, n).join('\n');
}

if (process.env.ENVCODE === 'local') {
  (async () => {
    // Start your app
    await app.start(Number(process.env.PORT) || 3000);

    console.log('⚡️ Bolt app is running!');
  })();
}
