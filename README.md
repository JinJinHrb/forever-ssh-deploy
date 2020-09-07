# Simple SSH Deploy

a simple deployment tool for node.js

## Installation

```
npm install forever-ssh-deploy
```

## Deployment Process

1. zip the source folder[srcFolderPath]

2. upload the zip file onto the server via SFTP (only private key authentication)

3. unzip and exec script
    
    * the default script use forever to start index.js located at the parent folder for "destFolderPath"

    * you can override the bash script via field "initScript" in constructor arguments for Deploy

## Example Usage

There is an example in [examples](examples/) folder.
Five mandatory fields for argument is: author, srcFolderPath, destFolderPath, privateKeyPath, host, username

```javascript
const Deploy = require('../src/deploy');

const author = 'your name';
const srcFolderPath = 'the path for the local project sub folder which is to replace the remote counterpart';
const destFolderPath = 'remote project sub folder which is to be replace by the local counterpart';
const privateKeyPath = 'path for ssh private key';
const host = 'xxx.xxx.xxx.xxx';
const username = 'developer';
const initScript = '#!/bin/bash...'; // override the default init Script

const deployer = new Deploy({
    author, srcFolderPath, destFolderPath, privateKeyPath, host, username
})
deployer.exec();
```

## Default Init Script

```bash
#!/bin/bash
# author: WangFan
# description: backup server directory
time1=$(date +"%Y-%m-%dT%H-%M-%S")
str1='server.'
str2='改前.tar.gz'
time2=$str1$time1$str2
tar -czvf $time2 server &&
 unzip -o server.zip &&
 rm -f server.zip &
 nohup forever stop index.js &
 forever start -o nohup.out -e nohup.out index.js
```