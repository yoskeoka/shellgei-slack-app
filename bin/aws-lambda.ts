#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {ShellgeiSlackAppStack} from '../infra/aws-lambda';

const app = new cdk.App();
new ShellgeiSlackAppStack(app, 'ShellgeiSlackAppStack');
