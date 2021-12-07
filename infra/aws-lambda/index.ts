import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as apigateway from '@aws-cdk/aws-apigateway';

import * as path from 'path';
import {config} from 'dotenv';

const pathToConfig = '../.env';

export class ShellgeiSlackAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    config({path: path.resolve(__dirname, pathToConfig)});
    const appLambda = new lambda.DockerImageFunction(this, 'appLambda', {
      functionName: 'shellgeiSlackAppFunction',
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, '../../'),
        {
          file: './infra/aws-lambda/Dockerfile',
        },
      ),
      environment: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || '',
      },
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    new apigateway.LambdaRestApi(this, 'slackApi', {
      handler: appLambda,
    });
  }
}
