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

/**
 * Stack that creates an EC2 instance with SSH access from a specified IP.
 */
export class Ec2WithSSHStack extends Stack {
  // Make resources available to subclasses or for testing
  public readonly vpc: Vpc;
  public readonly securityGroup: SecurityGroup;
  public readonly instance: Instance;
  public readonly role: Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Validate inputs
    const myIPv4 = this.validateInputs();

    // Create networking resources
    this.vpc = this.createVpc();
    this.securityGroup = this.createSecurityGroup(this.vpc, myIPv4);

    // Create IAM resources
    this.role = this.createInstanceRole();

    // Define the instance
    const keyPair = this.createKeyPair();
    const userData = this.loadUserData();
    this.instance = this.createEc2Instance(
      this.vpc,
      this.securityGroup,
      this.role,
      keyPair,
      userData
    );

    // Define outputs
    this.createOutputs(this.instance);
  }

  /**
   * Validates required input parameters.
   * @returns The validated IP address
   */
  private validateInputs(): string {
    const myIPv4 = this.node.tryGetContext('myIp');
    if (!myIPv4) {
      throw new Error(
        'IP address must be provided via context. Use: cdk deploy -c myIp=your.ip.address/32'
      );
    }
    return myIPv4;
  }

  /**
   * Creates a VPC with a single public subnet.
   */
  private createVpc(): Vpc {
    return new Vpc(this, 'Vpc', {
      maxAzs: 1,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24,
        },
      ],
    });
  }

  /**
   * Creates a security group allowing SSH access from a specific IP.
   */
  private createSecurityGroup(vpc: Vpc, sourceIp: string): SecurityGroup {
    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow SSH access to EC2 instance',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      Peer.ipv4(sourceIp),
      Port.tcp(22),
      'Allow SSH access from specified IP'
    );

    return securityGroup;
  }

  /**
   * Creates an IAM role for the EC2 instance with SSM access.
   */
  private createInstanceRole(): Role {
    return new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
  }

  /**
   * Creates a key pair with the specified public key material.
   */
  private createKeyPair(): KeyPair {
    const publicSSHKey =
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMw8LUO9n7J7YuligJXAGviDKzpVFmuxgp5ma0ryzVHd sghost13_aws_mac_ed25519';

    return new KeyPair(this, 'ec2WithSSH-KeyPair', {
      publicKeyMaterial: publicSSHKey,
    });
  }

  /**
   * Loads user data from a file.
   */
  private loadUserData(): UserData {
    return UserData.custom(
      fs.readFileSync(path.join(__dirname, '../userData/user-data.yml'), 'utf8')
    );
  }

  /**
   * Creates an EC2 instance with the specified configuration.
   */
  private createEc2Instance(
    vpc: Vpc,
    securityGroup: SecurityGroup,
    role: Role,
    keyPair: KeyPair,
    userData: UserData
  ): Instance {
    return new Instance(this, 'Instance', {
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
      securityGroup,
      role,
      keyPair,
      userData,
    });
  }

  /**
   * Creates CloudFormation outputs for the EC2 instance.
   */
  private createOutputs(instance: Instance): void {
    new CfnOutput(this, 'ec2WithSSH-InstanceId', {
      value: instance.instanceId,
      description: 'The ID of the EC2 instance',
    });

    new CfnOutput(this, 'ec2WithSSH-InstancePublicIp', {
      value: instance.instancePublicIp,
      description: 'The public IP address of the EC2 instance',
    });
  }
}
