const Deploy = require('forever-ssh-deploy');

const author = 'your name';
const srcFolderPath = 'the path for the local project sub folder which is to replace the remote counterpart';
const deployConfigs = [
    {
        destFolderPath: 'remote project sub folder which is to be replaced by the local counterpart',
        host: 'xxx.xxx.xxx.xxx',
        username: 'developer',
        port: 22,
        privateKeyPath: 'path for ssh private key'
    },
    {
        destFolderPath: 'remote project #2 sub folder which is to be replaced by the local counterpart',
        host: 'yyy.yyy.yyy.yyy',
        username: 'developer #2',
        port: 22,
        privateKeyPath: 'path for ssh private key'
    }
]

const deployers = deployConfigs.filter(a => a).map(a => {
    const aCopy = { ...a };
    aCopy.author = author;
    aCopy.srcFolderPath = srcFolderPath;
    return new Deploy(aCopy);
})
const recur = () => {
    if(deployers.length < 1){
        return;
    }
    const task = deployers.shift();
    task.exec().then(recur);
}
recur();