import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { cicdProps } from "../parameter/index";
import { NetworkConstruct } from "./construct/network-construct";
import { AsgConstruct } from "./construct/asg-construct";
import { AlbConstruct } from "./construct/alb-construct";
import { DeployConstruct } from "./construct/deploy-construct";

export interface CicdStackProps extends cdk.StackProps, cicdProps {}

export class CicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const networkConstruct = new NetworkConstruct(this, "NetworkConstruct", {
      ...props.systemParams,
      ...props.networkParams,
    });

    const asgConstruct = props.asgParams
      ? new AsgConstruct(this, "AsgConstruct", {
          ...props.systemParams,
          ...props.asgParams,
          networkConstruct,
          artifactBucketArn: props.artifactBucketArn,
        })
      : undefined;

    const albConstruct = props.albParams
      ? new AlbConstruct(this, "AlbConstruct", {
          ...props.systemParams,
          ...props.albParams,
          networkConstruct,
          asgConstruct,
        })
      : undefined;

    if (!albConstruct || !asgConstruct) {
      return;
    }
    new DeployConstruct(this, "DeployConstruct", {
      ...props.systemParams,
      asgConstruct,
      albConstruct,
      targetNames: props.albParams?.targetNames!,
    });
  }
}
