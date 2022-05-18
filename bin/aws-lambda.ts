#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {ShellgeiSlackAppStack} from '../infra/aws-lambda';

import * as path from 'path';
import * as fs from 'fs';
import {config} from 'dotenv';

const pathToConfig = '../.env';
const confPath = path.resolve(__dirname, pathToConfig);

if (!fs.existsSync(confPath)) {
  console.warn('.env file does not exist at %s', confPath);
}

config({path: confPath});

const app = new cdk.App();
new ShellgeiSlackAppStack(app, 'ShellgeiSlackAppStack', {
  env: {
    region: process.env.AWS_REGION || 'us-east-1',
  },
});
