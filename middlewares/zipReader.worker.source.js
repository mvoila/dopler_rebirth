const fs = require ('fs');
const ZIPreader = require('jszip')
const {
  parentPort, workerData,
} = require('node:worker_threads');

let FilesDecoded = [];
const dataWorker = workerData;

fs.readFile(dataWorker.fileToRead, async function(err, data) {
  if(err) throw err;
  await ZIPreader.loadAsync(data).then(function (zip) {
    Object.keys(zip.files).forEach(async (name,posFile) => {
      if(!zip.files[name].dir){
        await zip.files[name].async(dataWorker.encType).then(function (DataDecode) {
          parentPort.postMessage({type:'file', nameFile:name, data: DataDecode});
          if(posFile === Object.keys(zip.files).length-1)
            parentPort.postMessage({type:'end'});
        });
      }else{
        folderXML = name;
      }
    });
  });
  
});






    

   