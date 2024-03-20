#!/bin/bash

# -x to display the command to be executed
set -xeu

# Redirect /var/log/user-data.log and /dev/console
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

# Install Packages
token=$(
  curl \
    -s \
    -X PUT \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" \
    "http://169.254.169.254/latest/api/token"
)
region_name=$(
  curl \
    -s \
    -H "X-aws-ec2-metadata-token: $token" \
    "http://169.254.169.254/latest/meta-data/placement/availability-zone" |
    sed -e 's/.$//'
)

dnf install -y \
  "https://s3.${region_name}.amazonaws.com/amazon-ssm-${region_name}/latest/linux_amd64/amazon-ssm-agent.rpm" \
  ruby \
  httpd

cd /usr/src/
curl https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install \
  -o install
chmod +x ./install
./install auto
systemctl status codedeploy-agent
cat /opt/codedeploy-agent/.version

systemctl enable amazon-ssm-agent --now
systemctl enable httpd --now
