/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import './env';
import {
  AckFn,
  App,
  ExpressReceiver,
  LogLevel,
  MessageAttachment,
  RespondArguments,
  RespondFn,
  SayFn,
  SlashCommand,
} from '@slack/bolt';
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
const imageShareSlackChannel = process.env.IMG_SHARE_SLACK_CHAN || '';
const additionalHelpText = process.env.ADDITIONAL_HELP_TEXT || '';

app.command('/shellgei', async ({client, command, ack, say, respond}) => {
  await shellgeiCommand(client, command, ack, respond, say, false);
});

app.command(
  '/shellgei-dryrun',
  async ({client, command, ack, say, respond}) => {
    await shellgeiCommand(client, command, ack, respond, say, true);
  },
);

async function shellgeiCommand(
  client: WebClient,
  command: SlashCommand,
  ack: AckFn<string | RespondArguments>,
  respond: RespondFn,
  say: SayFn,
  dryRun: boolean,
): Promise<void> {
  await ack();

  try {
    const cmd = command.text.trim();
    if (cmd.length == 0 || cmd == 'help') {
      await respond(help());
      return;
    }

    console.log('execute command: ', cmd);

    const result = await execCommand(cmd);
    const r = formatRes(cmd, result);
    let attachments = [] as MessageAttachment[];
    if (r.attachments) {
      attachments = attachments.concat(r.attachments);
    }

    if (imageShareSlackChannel) {
      const imgFiles = await salvageAndUploadImages(cmd, client);

      imgFiles.forEach((f) =>
        attachments.push({
          title: f.name,
          image_url: f.permalink,
        }),
      );
    }

    const text = head(r.text, 15);

    if (dryRun) {
      await respond({
        text,
        attachments,
      });
    } else {
      await say({
        text,
        attachments,
      });
    }
  } catch (e) {
    console.log(e);
    await respond(`${e}`);
  }
}

function help(): string {
  let helpText = `
  Usage:\n
  \`/shellgei help\` shows this help.\n
  \`/shellgei [commands]\` executes commands with /bin/bash\n
  \`/shellgei-dryrun [commands]\` executes commands with /bin/bash, but only show result to you\n
  To attach image, write image file to \`${imageOutputDir}\` directory, using redirect \`>\`. e.g. \`${imageOutputDir}/img.png\`\n
  `;

  if (additionalHelpText) {
    helpText = helpText + `\n${additionalHelpText}`;
  }
  return helpText;
}

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
    console.info('upload file: ', f);
    const fd = fs.readFileSync(f);

    const p = client.files.upload({
      channels: imageShareSlackChannel,
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

  cleanTmpDir();

  return imgFiles;
}

async function cleanTmpDir() {
  await execCommand('rm -rf /tmp');
}

type User = {id: string; name?: string; imageUrl?: string};

async function getUserInfo(userId: string, client: WebClient): Promise<User> {
  const user = await client.users.profile.get({user: userId});
  if (user.ok && user.profile) {
    const res = {
      id: userId,
      imageUrl: user.profile.image_24,
      name: user.profile.display_name,
    };

    if (!res.imageUrl) {
      res.imageUrl =
        'https://api.slack.com/img/blocks/bkb_template_images/plants.png';
    }

    if (!res.name) {
      res.name = userId;
    }

    return res;
  }
  return {id: userId};
}

function formatRes(
  cmd: string,
  result: string,
): {text: string; attachments?: MessageAttachment[]} {
  return {
    text: `\`\`\`\n/shellgei ${cmd}\n\`\`\`\n`,
    attachments: [{text: result}],
  };
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
    .then((result) => result.stdout)
    .catch((e: childProcess.ExecException) => e.message);
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
