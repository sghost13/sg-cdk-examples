#!/usr/local/opt/node/bin/node
import { App } from 'aws-cdk-lib';
import { Ec2WithSshStack } from '../lib/ec2-with-ssh-stack';

const app = new App();
new Ec2WithSshStack(app, 'Ec2WithSshStack', {});
