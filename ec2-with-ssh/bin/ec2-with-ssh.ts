#!/usr/local/opt/node/bin/node
import { App } from 'aws-cdk-lib';
import { Ec2WithSSHStack } from '../lib/ec2-with-ssh-stack';

const app = new App();
new Ec2WithSSHStack(app, 'Ec2WithSSHStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
