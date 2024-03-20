import * as cdk from "aws-cdk-lib";

export interface NetworkParams {
  vpcCidr: string;
  subnetConfigurations: cdk.aws_ec2.SubnetConfiguration[];
  maxAzs: number;
  natGateways: number;
}

export interface AsgParams {
  asgs: {
    asgName: string;
    machineImage: cdk.aws_ec2.IMachineImage;
    instanceType: cdk.aws_ec2.InstanceType;
    subnetSelection: cdk.aws_ec2.SubnetSelection;
  }[];
}

export interface AlbParams {
  internetFacing: boolean;
  allowIpAddresses: string[];
  subnetSelection: cdk.aws_ec2.SubnetSelection;
  targetNames: string[];
}

export interface SystemParams {
  systemPrefix: string;
  envName: string;
}

export interface cicdProps {
  systemParams: SystemParams;
  networkParams: NetworkParams;
  asgParams?: AsgParams;
  albParams?: AlbParams;
  artifactBucketArn: string;
}

export interface cicdStackParams {
  env?: cdk.Environment;
  props: cicdProps;
}

export const cicdStackParams: cicdStackParams = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  props: {
    systemParams: {
      systemPrefix: "non-97",
      envName: "sandbox",
    },
    networkParams: {
      vpcCidr: "10.10.0.0/20",
      subnetConfigurations: [
        {
          name: "public",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 27,
        },
      ],
      maxAzs: 2,
      natGateways: 0,
    },
    asgParams: {
      asgs: [
        {
          asgName: "web",
          machineImage: cdk.aws_ec2.MachineImage.lookup({
            name: "RHEL-9.2.0_HVM-20231115-x86_64-23-Hourly2-GP3",
            owners: ["309956199498"],
          }),
          instanceType: new cdk.aws_ec2.InstanceType("t3.micro"),
          subnetSelection: {
            subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          },
        },
      ],
    },
    albParams: {
      internetFacing: true,
      allowIpAddresses: ["0.0.0.0/0"],
      subnetSelection: {
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
      },
      targetNames: ["web"],
    },
    artifactBucketArn: "arn:aws:s3:::aws-codedeploy-us-east-1",
  },
};
