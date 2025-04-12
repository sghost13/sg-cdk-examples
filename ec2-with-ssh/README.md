# EC2 with SSH

A streamlined AWS CDK project for deploying secure, temporary Linux servers with SSH access. When you just need a throw-away Linux machine without the hassle.

## Overview

This project provides a quick way to deploy a disposable Ubuntu Linux server on AWS with:

- Proper security configuration (SSH access limited to your IP only)
- AWS SSM access for management
- Pre-configured key pair for immediate SSH access
- Easy deployment and cleanup

## Deployment

Deploy the server using the included scripts that automatically detect your IP. It will throw errors if you don't:

```bash
npm run deploy
```

```bash
npm run destroy
```

The Deploy/Destroy uses ipify api to get your current ip. Only your current IP will get whitelisted access to the ec2 instance.

```bash
MY_IPV4=$(curl -s https://api.ipify.org) && cdk deploy -c IPV4="${MY_IPV4}/32"
```

## Configuration

### SSH

Create an ssh key, if you don't already have one.

```bash
ssh-keygen -t ed25519 -C "aws-example-key"
```

#### Upload the key to AWS

##### **For macOS:**

```bash
KEY_NAME="example-key"
KEY_PATH="/${HOME}/path/to/key.pub"

aws ec2 import-key-pair \
  --key-name "${KEYNAME}" \
  --public-key-material "$(base64 -i "${KEY_PATH}")"
```

##### **For Linux:**

```bash
KEY_NAME="example-key"
KEY_PATH="/${HOME}/path/to/key.pub"

aws ec2 import-key-pair \
  --key-name sghost13_mac_aws_ed25519 \
  --public-key-material "$(base64 -w 0 $KEY_PATH)"

```

#### Add key to ec2-with-ssh-stack.ts

Add your `$KEY_NAME` from above to the keyPair from `ec2-with-ssh-stack.ts`

### Instance Type

The default instance type is `t3.xlarge`. To change it, modify the `createEc2Instance` method in `ec2-with-ssh-stack.ts`.

### Storage

The default EBS volume size is 125GB. Adjust this in the `blockDevices` configuration within the `createEc2Instance` method.

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
