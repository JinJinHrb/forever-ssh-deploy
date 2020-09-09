#!/bin/bash
# author: WangFan
# description: backup server directory
time1=$(date +"%Y-%m-%dT%H-%M-%S")
str1='server.'
str2='改前.tar.gz'
time2=$str1$time1$str2
tar -czvf $time2 server &&
 unzip -o server.zip -d ${destFolderPath} &&
 sleep 5 &&
 rm -f server.zip &
 nohup forever stop index.js &
 forever start -o nohup.out -e nohup.out index.js