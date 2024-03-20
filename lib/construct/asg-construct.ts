import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SystemParams, AsgParams } from "../../parameter/index";
import { NetworkConstruct } from "./network-construct";
import * as fs from "fs";
import * as path from "path";

export interface AsgConstructProps extends SystemParams, AsgParams {
  networkConstruct: NetworkConstruct;
  artifactBucketArn: string;
}

export class AsgConstruct extends Construct {
  readonly asgs: {
    asgName: string;
    asg: cdk.aws_autoscaling.AutoScalingGroup;
  }[];

  constructor(scope: Construct, id: string, props: AsgConstructProps) {
    super(scope, id);

    // IAM Role
    const role = new cdk.aws_iam.Role(this, "Role", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
        new cdk.aws_iam.ManagedPolicy(this, "Policy", {
          statements: [
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ["s3:Get*", "s3:List*"],
              resources: [`${props.artifactBucketArn}/*`],
            }),
          ],
        }),
      ],
      roleName: `${props.systemPrefix}-${props.envName}-role-asg`,
    });

    // User data
    const userData = cdk.aws_ec2.UserData.forLinux();
    userData.addCommands(
      fs.readFileSync(
        path.join(__dirname, "../ec2-settings/user-data/default.sh"),
        "utf8"
      )
    );

    // ASGs
    this.asgs = props.asgs.map((asgProps) => {
      const asgNameSuffix = asgProps.asgName ? `-${asgProps.asgName}` : "";
      const asgName = `${props.systemPrefix}-${props.envName}-asg${asgNameSuffix}`;

      // Instance
      const asg = new cdk.aws_autoscaling.AutoScalingGroup(this, "Default", {
        machineImage: asgProps.machineImage,
        instanceType: asgProps.instanceType,
        vpc: props.networkConstruct.vpc,
        vpcSubnets: props.networkConstruct.vpc.selectSubnets(
          asgProps.subnetSelection
        ),
        maxCapacity: 2,
        minCapacity: 2,
        userData,
        role,
        healthCheck: cdk.aws_autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(1),
        }),
      });

      return { asgName, asg };
    });
  }
}
