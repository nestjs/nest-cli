#!/usr/bin/env bash
apt-get update
apt-get install -y curl
apt-get install -y git
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
apt-get install -y nodejs