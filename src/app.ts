/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './env';
import {App, ExpressReceiver, LogLevel, MessageAttachment} from '@slack/bolt';
import {WebClient, FilesUploadResponse} from '@slack/web-api';
import {File} from '@slack/web-api/dist/response/FilesUploadResponse';
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
import * as fs from 'fs';
import * as path from 'path';

const imageOutputDir = process.env.IMG_OUTPUT_DIR || '/tmp/images';

app.command('/shellgei', async ({command, ack, say, respond, client}) => {
  await ack();

  try {
    const result = await execCommand(command.text);

    const imgUrls = await salvageAndUploadImages(command.text, client);
    const attachments = imgUrls.map((f) => {
      return {
        title: f.name,
        image_url: f.permalink,
      } as MessageAttachment;
    });
    const sayResult = await say({
      as_user: true,
      text: formatRes(command.text, result),
      attachments,
    });
    if (!sayResult.ok) {
      await respond(
        `error: '${sayResult.error}', message: '${sayResult.message}'`,
      );
    }
  } catch (e) {
    console.log(e);
    await respond(`${e}`);
  }
});

app.command('/shellgei-dryrun', async ({command, ack, respond, client}) => {
  await ack();

  try {
    const result = await execCommand(command.text);
    const imgUrls = await salvageAndUploadImages(command.text, client);
    const attachments = imgUrls.map((f) => {
      return {
        title: f.name,
        image_url: f.permalink,
      } as MessageAttachment;
    });
    await respond({
      text: formatRes(command.text, result),
      attachments,
    });
  } catch (e) {
    console.log(e);
    await respond(`${e}`);
  }
});

async function salvageAndUploadImages(
  cmd: string,
  client: WebClient,
): Promise<File[]> {
  let imgPathList = [] as string[];
  try {
    imgPathList = fs
      .readdirSync(imageOutputDir)
      .map((f) => path.join(imageOutputDir, f));
  } catch (e) {
    console.log(e);
    return [];
  }

  const imgFiles = [] as File[];
  const plist = [] as Promise<FilesUploadResponse>[];

  for (const f of imgPathList) {
    console.log('upload file: ', f);
    const fd = fs.readFileSync(f);

    const p = client.files.upload({
      channels: '#shellgei_bot_images',
      file: fd,
      filename: path.basename(f),
      title: path.basename(f),
      initial_comment: `\`\`\`\n/shellgei ${cmd}\n\`\`\``,
    });
    plist.push(p);
  }

  await Promise.all(plist).then((resList) => {
    resList.forEach((res) => {
      if (res.ok && res.file) {
        const f = res.file;
        if (f) {
          imgFiles.push(f);
          console.log('uploaded file: ', f);
        }
      }
    });
  });

  return imgFiles;
}

function formatRes(cmd: string, result: string): string {
  return `> ${cmd}\n${result}`;
}

import * as childProcess from 'child_process';

async function execCommand(cmd: string): Promise<string> {
  try {
    process.chdir('/');
    if (!fs.existsSync(imageOutputDir)) {
      fs.mkdirSync(imageOutputDir);
    }
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
