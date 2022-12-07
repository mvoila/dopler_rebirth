const {
    Worker, isMainThread, parentPort, workerData,
  } = require('node:worker_threads');
const path = require('path');


function xmlReader(file,encoding){
  if (isMainThread) {
    module.exports = function asyncLoadXML(stringToDecode,encoding) {
      return new Promise((resolve,reject) => {
        const worker = new Worker(__filename, {
          workerData: {fileToRead : file, encType : encoding},
        });
        worker.on('online', () => { console.log('Launching ZIP deflation') })
        worker.on('message', msg => resolve(msg));
        worker.on('error', () => reject(new Error(`Worker sends error`)));
        worker.on('exit', (code) => {
          if (code !== 0) throw new Error(`Worker stopped with exit code ${code}`);
        });
      });
    };
  } else {
    const ZIPreader = require('fast-xml-parser')
    const data = workerData;

    let FilesDecoded = []
    let internalFolder = '';
        
    fs.readFile(data.fileToRead, function(err, data) {
    if(err) throw err;

    });
  }
  parentPort.postMessage(FilesDecoded);
}


   