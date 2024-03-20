import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SystemParams } from "../../parameter/index";
import { AsgConstruct } from "./asg-construct";
import { AlbConstruct } from "./alb-construct";

export interface DeployConstructProps extends SystemParams {
  targetNames: string[];
  asgConstruct: AsgConstruct;
  albConstruct: AlbConstruct;
}

export class DeployConstruct extends Construct {
  readonly vpc: cdk.aws_ec2.IVpc;

  constructor(scope: Construct, id: string, props: DeployConstructProps) {
    super(scope, id);

    const targets = props.asgConstruct
      ? props.targetNames
          .map((targetNameSuffix) => {
            const asgNameSuffix =
              targetNameSuffix !== "" ? `-${targetNameSuffix}` : "";
            const targetName = `${props.systemPrefix}-${props.envName}-asg${asgNameSuffix}`;

            return props.asgConstruct?.asgs.find((asg) => {
              return asg.asgName === targetName;
            })?.asg;
          })
          .filter((asg): asg is cdk.aws_autoscaling.AutoScalingGroup => !!asg)
      : undefined;

    if (!targets) {
      return;
    }

    new cdk.aws_codedeploy.ServerDeploymentGroup(this, "Default", {
      autoScalingGroups: targets,
      loadBalancers: [
        cdk.aws_codedeploy.LoadBalancer.application(
          props.albConstruct.targetGroup
        ),
      ],
      installAgent: false,
      deploymentConfig: cdk.aws_codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME,
    });
  }
}
