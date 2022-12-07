const {asyncLoadZipArchive} = require('./zipReader.worker');
const {asyncLoadXML} = require('./xmlReader.worker');
const UnsupFileError = require('../errors/unsupportedfile.error')
const zipPattern = /zip$/;
const xmlPattern = /xml$/;

async function readFiles(filesArray,encoding){
    filesArray.forEach(async (file)=>{
        if(zipPattern.test(file)){
            try{
                await asyncLoadZipArchive(file,encoding).then(
                    (value) => {console.dir(value);},
                    (reason) => { return reason.message; },
                );
            }catch(error){
                console.dir(error);
            }
        }else if(xmlPattern.test(file)){
            await asyncLoadXML(file).then(
                (value) => {console.dir(value);},
                (reason) => { return reason.message; },
            );
        }else{
            throw new UnsupFileError('Type de fichier non supporté','Veuillez importer des fichiers au format XML ou des ZIPs contenant des fichiers XML');
        }
    });
}

async function readFile(file,encoding){
    if(zipPattern.test(file)){
        return new Promise(function(resolve, reject) {
            asyncLoadZipArchive(file,encoding).then(
                (value) => {
                    resolve(value);
                },
                (reason) => { 
                    reject(reason);
                },
            );
        });
    }else if(xmlPattern.test(file)){
        asyncLoadXML(file).then(
            (value) => {console.dir(value);},
            (reason) => { return reason.message; },
        );
    }else{
        throw new UnsupFileError('Type de fichier non supporté','Veuillez importer des fichiers au format XML ou des ZIPs contenant des fichiers XML');
    }
}

module.exports = {readFile, readFiles};