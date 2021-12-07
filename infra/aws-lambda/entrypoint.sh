#!/bin/sh
if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  exec /aws-lambda/aws-lambda-rie npx aws-lambda-ric $@
else
  exec npx aws-lambda-ric $@
fi
