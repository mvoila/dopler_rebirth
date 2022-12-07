const {
    Worker, parentPort, workerData,
  } = require('node:worker_threads');


function asyncLoadZipArchive(file,encoding){
  const deflatedFiles = []
  return new Promise((resolve, reject) => {
    const worker = new Worker('./middlewares/zipReader.worker.source.js', {
          workerData: {fileToRead : file, encType : encoding},
    });
    worker.on('online', () => { })
    worker.on('message', (msg) => {
                            if(msg.type === 'file'){
                              deflatedFiles.push({name:msg.nameFile, data:msg.data});
                            }else if(msg.type === 'end'){
                              resolve(deflatedFiles)
                            }  
                          });
    worker.on('error', error => reject(error));
    worker.on('exit', code => {
      if (code !== 0) console.log(`Worker stopped with exit code ${code}`);
    });
  });
};

module.exports = {asyncLoadZipArchive};