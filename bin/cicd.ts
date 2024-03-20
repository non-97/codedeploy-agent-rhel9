#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CicdStack } from "../lib/cicd-stack";
import { cicdStackParams } from "../parameter/index";

const app = new cdk.App();
new CicdStack(
  app,
  `cicd-${cicdStackParams.props.systemParams.systemPrefix}-${cicdStackParams.props.systemParams.envName}`,
  {
    env: cicdStackParams.env,
    ...cicdStackParams.props,
  }
);
