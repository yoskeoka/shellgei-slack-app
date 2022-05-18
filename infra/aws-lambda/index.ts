import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as path from 'path';

const lambdaExecutionTimeoutSec = Number(
  process.env.AWS_LAMBDA_EXECUTION_TIMEOUT_SEC || 10,
);

export class ShellgeiSlackAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appLambda = new lambda.DockerImageFunction(this, 'appLambda', {
      functionName: 'shellgeiSlackAppFunction',
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, '../../'),
        {
          file: './infra/aws-lambda/Dockerfile',
        },
      ),
      environment: {
        LOG_LEVEL: process.env.LOG_LEVEL || '',
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || '',
        IMG_OUTPUT_DIR: process.env.IMG_OUTPUT_DIR || '',
        IMG_SHARE_SLACK_CHAN: process.env.IMG_SHARE_SLACK_CHAN || '',
        ADDITIONAL_HELP_TEXT: process.env.ADDITIONAL_HELP_TEXT || '',
      },
      timeout: cdk.Duration.seconds(lambdaExecutionTimeoutSec),
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const provisionedConcurrentExecutions = Number(
      process.env.AWS_LAMBDA_PROVISIONED_CONCURRENT_EXECUTIONS || '0',
    );

    if (provisionedConcurrentExecutions > 0) {
      appLambda.currentVersion.addAlias('Alias', {
        provisionedConcurrentExecutions: provisionedConcurrentExecutions,
      });
    }

    new apigateway.LambdaRestApi(this, 'slackApi', {
      handler: appLambda,
    });
  }
}
