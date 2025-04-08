# EC2 with SSH

A streamlined AWS CDK project for deploying secure, temporary Linux servers with SSH access. When you just need a throw-away Linux machine without the hassle.

## Overview

This project provides a quick way to deploy a disposable Ubuntu Linux server on AWS with:

- Proper security configuration (SSH access limited to your IP only)
- AWS SSM access for management
- Pre-configured key pair for immediate SSH access
- Easy deployment and cleanup

## Getting Started

Deploy the server using the included script (automatically detects your IP):

```bash
npm run deploy
```

When finished, clean up all resources:

```bash
npm run destroy
```

## Configuration

### Instance Type

The default instance type is `t3.xlarge`. To change it, modify the `createEc2Instance` method in `ec2-with-ssh-stack.ts`.

### Storage

The default EBS volume size is 125GB. Adjust this in the `blockDevices` configuration within the `createEc2Instance` method.

### SSH Key

The deployment uses a predefined public key. Replace it with your own by modifying the `createKeyPair` method.

### User Data

Initial server configuration happens through the user data script in `userData/user-data.yml`. Customize this file to install packages or run setup commands on instance launch.

## Security Notes

- SSH access is restricted to only your specified IP address
- The instance has a security group that blocks all other incoming traffic
- AWS SSM is configured for alternative access if needed
- While designed for temporary use, remember to destroy resources when done to avoid unnecessary costs

## Project Structure

- `lib/` - Contains the CDK stack definition
- `bin/` - Contains the CDK app entry point
- `userData/` - Contains cloud-init configurations for server bootstrapping
- `cdk.json` - CDK configuration

## License

MIT No Attribution
