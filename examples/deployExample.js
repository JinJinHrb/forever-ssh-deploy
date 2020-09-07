const Deploy = require('../src/deploy');

const author = 'your name';
const srcFolderPath = 'the path for the local project sub folder which is to replace the remote counterpart';
const destFolderPath = 'remote project sub folder which is to be replace by the local counterpart';
const privateKeyPath = 'path for ssh private key';
const host = 'xxx.xxx.xxx.xxx';
const username = 'developer';

const deployer = new Deploy({
    author, srcFolderPath, destFolderPath, privateKeyPath, host, username
})
deployer.exec();