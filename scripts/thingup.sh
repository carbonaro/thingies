#!/bin/bash
uri=$1
key=$2

private_ip=`/sbin/ifconfig eth0|/usr/bin/xargs|/usr/bin/awk '{print $7}'|/bin/sed -e 's/[a-z]*:/''/'`
echo "Found private IP address: $private_ip"

public_ip=`/usr/bin/curl http://myip.dnsomatic.com`
echo "Found public IP address: $public_ip"
echo "Posting to $uri?key=$2"

curl -X POST "$uri?key=$2" \
    -d "private_ip=$private_ip" \
    -d "public_ip=$public_ip"
