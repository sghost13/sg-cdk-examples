import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  BlockDeviceVolume,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export class Ec2WithSSHStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Get IP address from context (in this case package.json scripts)
    const myIPV4 = this.node.tryGetContext('IPV4');
    if (!myIPV4) {
      throw new Error(
        'IP address must be provided via context. Use: npm run deploy/destroy'
      );
    }

    // Create VPC
    const vpc = new Vpc(this, 'ec2WithSSH-Vpc', {
      maxAzs: 1,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24,
        },
      ],
    });

    // Create security group
    const securityGroup = new SecurityGroup(this, 'ec2WithSSH-SecurityGroup', {
      vpc,
      description: 'Allow SSH access to EC2 instance',
      allowAllOutbound: true,
    });

    // Add SSH ingress rule
    securityGroup.addIngressRule(
      Peer.ipv4(myIPV4),
      Port.tcp(22),
      'Allow SSH access from specified IP'
    );

    // Create role for EC2 instance
    const role = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add user data directly from file
    const userData = UserData.custom(
      fs.readFileSync(path.join(__dirname, '../userData/user-data.yml'), 'utf8')
    );

    // This is not my real key. This is just an example key.
    // You should not add a real key to github, even though it is just the public key.
    // In a real environment, use SSM or secret store, or even github secrets.
    const keyPair = new KeyPair(this, 'ec2WithSSH-KeyPair', {
      publicKeyMaterial:
        'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMw8LUO9n7J7YuligJXAGviDKzpVFmuxgp5ma0ryzVHd sghost13_aws_mac_ed25519',
    });

    // Create EC2 instance
    const ec2Instance = new Instance(this, 'ec2WithSSH-ec2Instance', {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.XLARGE),
      // Use Ubuntu 22.04 LTS (Jammy Jellyfish) with region mapping
      machineImage: MachineImage.lookup({
        name: 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
        owners: ['099720109477'], // Canonical's AWS account ID
      }),
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: BlockDeviceVolume.ebs(125),
        },
      ],
      keyPair,
      securityGroup,
      role,
      userData,
    });

    // Create outputs
    new CfnOutput(this, 'ec2WithSSH-InstanceId', {
      value: ec2Instance.instanceId,
      description: 'The ID of the EC2 instance',
    });

    new CfnOutput(this, 'ec2WithSSH-InstancePublicIp', {
      value: ec2Instance.instancePublicIp,
      description: 'The public IP address of the EC2 instance',
    });
  }
}
