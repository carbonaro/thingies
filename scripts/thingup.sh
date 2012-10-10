#!/bin/bash
uri=$1
key=$2

private_ip=`ifconfig eth0|xargs|awk '{print $7}'|sed -e 's/[a-z]*:/''/'`
echo "Found private IP address: $private_ip"

public_ip=`curl http://myip.dnsomatic.com`
echo "Found public IP address: $public_ip"
echo "Posting to $uri?key=$2"

curl -X POST "$uri?key=$2" \
    -d "private_ip=$private_ip" \
    -d "public_ip=$public_ip"
