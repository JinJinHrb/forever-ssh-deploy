const Deploy = require('forever-ssh-deploy');

const author = 'your name';
const srcFolderPath = 'the path for the local project sub folder which is to replace the remote counterpart';
const deployConfigs = [
    {
        destFolderPath: 'remote project sub folder which is to be replaced by the local counterpart',
        host: 'xxx.xxx.xxx.xxx',
        username: 'developer',
        port: 22,
        password: 'your password'
    }
]

const deployers = deployConfigs.map(a => {
    const aCopy = { ...a };
    aCopy.author = author;
    aCopy.srcFolderPath = srcFolderPath;
    return new Deploy(aCopy);
})
deployers.forEach(a => a.exec());