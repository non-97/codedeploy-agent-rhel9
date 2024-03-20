import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SystemParams, AlbParams } from "../../parameter/index";
import { NetworkConstruct } from "./network-construct";
import { AsgConstruct } from "./asg-construct";

export interface AlbConstructProps extends SystemParams, AlbParams {
  networkConstruct: NetworkConstruct;
  asgConstruct?: AsgConstruct;
}

export class AlbConstruct extends Construct {
  readonly alb: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;
  readonly targetGroup: cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    // ALB
    this.alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      "Default",
      {
        vpc: props.networkConstruct.vpc,
        internetFacing: props.internetFacing,
        vpcSubnets: props.networkConstruct.vpc.selectSubnets(
          props.subnetSelection
        ),
        loadBalancerName: `${props.systemPrefix}-${props.envName}-alb`,
      }
    );

    // Target Group
    this.targetGroup =
      new cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup(
        this,
        "TargetGroup",
        {
          vpc: props.networkConstruct.vpc,
          protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
          protocolVersion:
            cdk.aws_elasticloadbalancingv2.ApplicationProtocolVersion.HTTP1,
          port: 80,
          targetType: cdk.aws_elasticloadbalancingv2.TargetType.INSTANCE,
          healthCheck: {
            path: "/",
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyThresholdCount: 5,
          },
          deregistrationDelay: cdk.Duration.minutes(1),
          targetGroupName: `${props.systemPrefix}-${props.envName}-tg-alb`,
        }
      );

    // Listener
    this.alb.addListener("ListenerHttp", {
      port: 80,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Add target
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

    targets?.forEach((target) => {
      this.targetGroup.addTarget(target);

      target.connections.allowFrom(this.alb, cdk.aws_ec2.Port.tcp(80));
    });
  }
}
