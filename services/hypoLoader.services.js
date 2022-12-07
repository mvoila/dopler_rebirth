const fs = require('node:fs');
const util = require('util'); // A enlever DEBUG
const crypto = require('node:crypto');
const {readFile} = require('../middlewares/fileReader.middleware');
const { XMLParser, XMLBuilder, XMLValidator} = require('fast-xml-parser');
const XMLoptions = {
  ignoreAttributes : false,
  allowBooleanAttributes : true,
  attributeNamePrefix : "Attr_",
};
const {getNeoDriver,buildNeoRedDependancies,runSingleWriteQuery} = require('../db/neo4j')
const UnsupFileError = require('../errors/unsupportedfile.error')

module.exports = class hypoLoader {
  /**
    * The constructor expects an instance of the Neo4j Driver, which will be
    * used to interact with Neo4j.
    *
    * @param {neo4j.Driver} driver
    */
  constructor(driver) {
    this.driver = driver
    this.folder = 'none';
    this.perfsAnalyser = [];
   /*  this.importHypothese = this.importHypothese.bind(this)
    this.importHypothesetoNode = this.importHypothesetoNode.bind(this)
    this.importHypoComplexe = this.importHypoComplexe.bind(this)
    this.importFileHypoDOPLER = this.importFileHypoDOPLER.bind(this)
    this.importXMLHypoCVG = this.importXMLHypoCVG.bind(this) */
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  #importHypothese(JSObj,dependancies,queriesToRun){
    let strEq = '';
    if(Array.isArray(JSObj.hypothese)){
      JSObj.hypothese.forEach(async (hypo,nbhypo) => {
        this.#importHypothesetoNode(hypo,dependancies,queriesToRun)
      });
    }else{
      this.#importHypothesetoNode(JSObj.hypothese,dependancies,queriesToRun)
    }
  }

  #importHypothesetoNode(hypo,dependancies,queriesToRun){
    const idHash = crypto.createHash('sha256');
    let createdTime = Date.now();
    let nodeString = `Hypothese:DOPLER:Maquette:ImportXML{nameUser:'${hypo.description}',`;
    //let nodeString = `Hypothese:DOPLER:Maquette:ImportXML{nameUser:'${hypo.description}',createdTime:'${createdTime}',`;  
    let hypoProperties = Object.keys(hypo);
    let strEq = '';
    let singleAttadependancies = [...dependancies];

    //Dirty, call recursive function !
    hypoProperties.forEach((key,idKey) => {
      if(key !== 'ouvrage' && key !== 'applicIntervalle'){
        if (typeof(hypo[key]) !== 'string'){
          if(typeof(hypo[key]) === 'object'){
            Object.keys(hypo[key]).forEach((subKey,nbSubKey) => {
              if(typeof(hypo[key][subKey]) === 'object'){
                Object.keys(hypo[key][subKey]).forEach((xsubKey,xnbSubKey) => {
                  if(typeof(hypo[key][subKey][xsubKey]) === 'object'){
                    Object.keys(hypo[key][subKey][xsubKey]).forEach((uxsubKey,uxnbSubKey) => {
                      if(typeof(hypo[key][subKey][xsubKey][uxsubKey] === 'object')){
                        Object.keys(hypo[key][subKey][xsubKey][uxsubKey]).forEach((vuxsubKey,vuxnbSubKey) => {
                          if(typeof(hypo[key][subKey][xsubKey][uxsubKey] === 'object')){
                            Object.keys(hypo[key][subKey][xsubKey][uxsubKey][vuxsubKey]).forEach((lvuxsubKey,lvuxnbSubKey) => {
                              nodeString += `${key.replace(':','_')}_${subKey.replace(':','_')}_${xsubKey.replace(':','_')}_${uxsubKey.replace(':','_')}_${vuxsubKey.replace(':','_')}_${lvuxsubKey.replace(':','_')}:'${hypo[key][subKey][xsubKey][uxsubKey][vuxsubKey][lvuxsubKey].toString().replace(/(?<!\\)'/g, "\\\'")}',`;
                            });
                          }else{
                            nodeString += `${key.replace(':','_')}_${subKey.replace(':','_')}_${xsubKey.replace(':','_')}_${uxsubKey.replace(':','_')}_${vuxsubKey.replace(':','_')}:'${hypo[key][subKey][xsubKey][uxsubKey][vuxsubKey].toString().replace(/(?<!\\)'/g, "\\\'")}',`;
                          }
                        });
                      }else{
                        nodeString += `${key.replace(':','_')}_${subKey.replace(':','_')}_${xsubKey.replace(':','_')}_${uxsubKey.replace(':','_')}:'${hypo[key][subKey][xsubKey][uxsubKey].toString().replace(/(?<!\\)'/g, "\\\'")}',`;
                      }
                    });
                  }else{
                    nodeString += `${key.replace(':','_')}_${subKey.replace(':','_')}_${xsubKey.replace(':','_')}:'${hypo[key][subKey][xsubKey].toString().replace(/(?<!\\)'/g, "\\\'")}',`
                  }
                });
              }else{
                nodeString += `${key.replace(':','_')}_${subKey.replace(':','_')}:'${hypo[key][subKey].toString().replace(/(?<!\\)'/g, "\\\'")}',`
              }
            });
          }else{
            hypo[key] = hypo[key].toString();
            nodeString += `${key.replace(':','_')}:'${hypo[key].replace(/(?<!\\)'/g, "\\\'")}',`
          }
        }else{
          nodeString += `${key.replace(':','_')}:'${hypo[key].replace(/(?<!\\)'/g, "\\\'")}',`
        }
      }else if(key === 'ouvrage'){
        nodeString += `ouvrage:'${hypo.ouvrage.Attr_name.replace(/(?<!\\)'/g, "\\\'")}',`
        const nodeVarHash = crypto.createHash('sha256');
        nodeVarHash.update(hypo.ouvrage.Attr_name);
        queriesToRun.push(`MERGE (o${nodeVarHash.digest('hex')}:Ouvrage:DOPLER:Maquette{name:'${hypo.ouvrage.Attr_name.replace(/(?<!\\)'/g, "\\\'")}'})`);
        singleAttadependancies.push({level:3, labels:'Ouvrage:DOPLER:Maquette',
        matchValues : [
          {property:'name',value:hypo.ouvrage.Attr_name},
        ],
        relations : [
          {direction : 'from_node', types : 'CONCERNS', matchValues : []}
        ]});
      }else{
        nodeString += `intervalle:'${hypo.ouvrage.Attr_name.replace(/(?<!\\)'/g, "\\\'")}',`
        const nodeVarHash = crypto.createHash('sha256');
        nodeVarHash.update(hypo.ouvrage.Attr_name);
        queriesToRun.push(`MERGE (o${nodeVarHash.digest('hex')}:Ouvrage:DOPLER:Maquette{name:'${hypo.ouvrage.Attr_name.replace(/(?<!\\)'/g, "\\\'")}'})`);
        singleAttadependancies.push({level:3, labels:'Ouvrage:DOPLER:Maquette',
        matchValues : [
          {property:'name',value:hypo.ouvrage.Attr_name},
        ],
        relations : [
          {direction : 'from_node', types : 'CONCERNS', matchValues : []}
        ]});
      }
    });
    
    let hashNodeString = '('+nodeString+'})';
    nodeString = `(m:${nodeString}`;
    idHash.update(hashNodeString);
    let idNodeComplex = idHash.digest('hex');
    nodeString = nodeString + `id:'${idNodeComplex}'})`;
    queriesToRun.push(buildNeoRedDependancies(nodeString,singleAttadependancies));
    //console.log('Query Hypo : '+strEq);
  }

  #importHypoComplexe(JSObj,dependancies,queriesToRun){
    let isCompposed = false;
    let createdTime = Date.now();
    const idHash = crypto.createHash('sha256');
    let isDecision = false;
    let newDependancy = [];
    let nodeName = '';
    const regDecision = new RegExp('(.*D-DI-CDI-[A-Za-z]{3}-.*|.*D-DEVIN-.*|.*D-DOP.*|.*Decision.*)');
     
    if(JSObj['hypoComplexe'].hasOwnProperty('Attr_nom')){
      nodeName = JSObj['hypoComplexe']['Attr_nom'].replace(/(?<!\\)'/g, "\\\'");
      if(regDecision.test(nodeName)){
        isDecision = true;
        queriesToRun.push(`MERGE (d:Decision:DOPLER:Maquette:ImportXML{name:'${nodeName}'})`);
      }
    }
    //let nodeString = `Grp:HypoComplexe:DOPLER:Maquette:ImportXML{name:'${nodeName}',createdTime:'${createdTime}',`;
    let nodeString = `Grp:HypoComplexe:DOPLER:Maquette:ImportXML{name:'${nodeName}',`;
    let hypoProperties = Object.keys(JSObj.hypoComplexe);
    let strEq = '';

    hypoProperties.forEach((key,idKey) => {
      if(key !== 'hypothese'){
        /* if (typeof(JSObj.hypoComplexe[key]) !== 'string' && typeof(JSObj.hypoComplexe[key]) !== 'undefined') console.log(JSObj.hypoComplexe[key]); */
        nodeString += `${key.replace(':','_')}:'${JSObj.hypoComplexe[key].replace(/(?<!\\)'/g, "\\\'")}',`
      }else{
        isCompposed = true;
      }
    });
    
    let hashNodeString = '('+nodeString+'})';
    nodeString = '(n:'+nodeString;

    idHash.update(hashNodeString);
    let idNodeComplex = idHash.digest('hex');
    nodeString = nodeString + `id:'${idNodeComplex}'})`; 
    queriesToRun.push(buildNeoRedDependancies(nodeString,dependancies));
    

    if(JSObj.hypoComplexe.hasOwnProperty('hypothese')){
      newDependancy.push({level:2, labels:'Grp:HypoComplexe:DOPLER:Maquette:ImportXML',
                            matchValues : [
//                              {property:'name',value:nodeName},
//                              {property:'createdTime', value:createdTime},
                              {property:'id', value:idNodeComplex}
                            ],
                            relations : [
                              {direction : 'to_node', types : 'CONTAINS', matchValues : []}
                            ]});
      if(isDecision){
        newDependancy.push({level:2, labels:'Decision:DOPLER:Maquette:ImportXML',
                            matchValues : [
                              {property:'name',value:nodeName},
                            ],
                            relations : [
                              {direction : 'to_node', types : 'CONTAINS', matchValues : []}
                            ]});
      }
      this.#importHypothese(JSObj.hypoComplexe,newDependancy,queriesToRun);
      //console.log('Qery Hypo : '+strEq);
    }else{
      //console.log('Enpty Complex Hypo.')
    }
  }  
  

  async #importXMLHypoCVG(xml,folder,filename,dependancies, enablePerfLof = false){
    const XMLreader = new XMLParser(XMLoptions);
    let JSObj = XMLreader.parse(xml);
    let queriesToRun = [];
    
    let debExecTime = Date.now();
    this.perfsAnalyser[filename].push({step:'Deb Parse', time:(debExecTime-(this.perfsAnalyser[filename][0].time))});
    if(JSObj.hasOwnProperty('hypoComplexe')){
      try {
        this.#importHypoComplexe(JSObj,dependancies,queriesToRun);
      }catch(dbError){
        throw dbError;
      }
    }else if(JSObj.hasOwnProperty('hypothese')){
      try {
        this.#importHypothese(JSObj,dependancies,queriesToRun);
      }catch(dbError){
        throw dbError;
      }
    }else{
      
    }
    debExecTime = Date.now();
    this.perfsAnalyser[filename].push({step:'End Parse', time:(debExecTime-(this.perfsAnalyser[filename][0].time))});

    //Build a mass importer object with quaery optimization
    const session = this.driver.session();
    const tx = session.beginTransaction();
    debExecTime = Date.now();
    this.perfsAnalyser[filename].push({step:'Deb Query', time:(debExecTime-(this.perfsAnalyser[filename][0].time))});
    let queryAnalysis = '';
    
    try {
      queriesToRun.forEach(async (queryToRun,idQuery) =>{
        queryAnalysis = queryToRun;
        tx.run(queryToRun);
      });
      
      await tx.commit();
    } catch (e) {
      console.log('Chavirage Req : error : '+e+'\n\n');
      debExecTime = Date.now();
      this.perfsAnalyser[filename].push({step:'Error Query', time:(debExecTime-(this.perfsAnalyser[filename][0].time))});
    }finally{
      debExecTime = Date.now();
      this.perfsAnalyser[filename].push({step:'Close Query', time:(debExecTime-(this.perfsAnalyser[filename][0].time))});
      await session.close()
      debExecTime = Date.now();
      this.perfsAnalyser[filename].push({step:'End Query',time:(debExecTime-(this.perfsAnalyser[filename][0].time))});
    }    
  }

  async importFileHypoDOPLER(file){
    let zipPattern = /zip$/;
    let xmlPattern = /xml$/;
    let folderXML = 'none';
    let numHypo = 0;
    let createdTime = Date.now();
    const session = this.driver.session();

    let queryCreateImport = `MERGE (n:Import:DOPLER:Maquette:ImportXML{name:'Import archive DOPLER',createdTime:'${createdTime}',source:'${file}'})`;
    try{
      //await runSingleWriteQuery(queryCreateImport,session);
      readFile(file,'string').then((deflatedFiles)=>{
        deflatedFiles.forEach(async (deflatedFile,indFile)  => {
            let dependancy = {level: 1, labels:'Import:DOPLER:Maquette:ImportXML',
            matchValues : [
                          {property:'createdTime',value:createdTime}
                          ,{property:'source', value:deflatedFile.name}
            ],relations : [
              {direction : 'to_node', types : 'GROUP', matchValues : []}
          ]}
          let debExecTime = Date.now();
          this.perfsAnalyser[deflatedFile.name] = [{step:'Deb', time:debExecTime}];
          await this.#importXMLHypoCVG(deflatedFile.data,folderXML,deflatedFile.name,[dependancy]);
        });
      })
      

        
    
      /* if(zipPattern.test(file)){
        fs.readFile(file, function(err, data) {
          if(err) throw err;
          ZIPreader.loadAsync(data).then(function (zip) {
            Object.keys(zip.files).forEach((name,posFile) => {
              if(!zip.files[name].dir){
                zip.files[name].async("string").then(function (xml) {
                  this.sleep(100*(posFile%50)).then(async() => {
                    let dependancy = {level: 1, labels:'Import:DOPLER:Maquette:ImportXML',
                                    matchValues : [
                                      {property:'createdTime',value:createdTime}
                                      ,{property:'source', value:file}
                                    ],relations : [
                                      {direction : 'to_node', types : 'GROUP', matchValues : []}
                                    ]}
                    let debExecTime = Date.now();
                    this.perfsAnalyser[name] = [{step:'Deb', time:debExecTime}];
                    await this.#importXMLHypoCVG(xml,folderXML,name,[dependancy]);
                    debExecTime = Date.now();
                    this.perfsAnalyser[name].push({step:'End',time: (debExecTime-(this.perfsAnalyser[name][0].time))});
                    //console.log('Import Done!');
                    console.dir(this.perfsAnalyser);
                  });
                }.bind(this));
              }else{
                folderXML = name;
              }
            });
          }.bind(this));
        }.bind(this)); 
      }else if(xmlPattern.test(file)){
        this.perfsAnalyser = [];
        fs.readFile(file, 'utf8', function(err, data) {
          if (err){ 
            throw err;
          }else{
            this.perfsAnalyser[file] = [{step:'Deb', time:Date.now()}];
            this.#importXMLHypoCVG(data,folderXML,file,[{labels:'Import:DOPLER:Maquette:ImportXML',matchValues : [{property:'date',value:createdTime}],
                                                  relations : [{direction : 'to_node', type : 'GROUP', matchValues : []}]
                                                }]);
            this.perfsAnalyser[file].push({step:'End',time: (Date.now()-(this.perfsAnalyser[file][0].time))});
          }
        }.bind(this));
      }else{
        throw new UnsupFileError('Type de fichier non supporté','Veuillez importer des fichiers au format XML ou des ZIPs contenant des fichiers XML');
      } */
    }catch(importError){
      console.log('Seems someting going wrong : '+importError)
    }finally{
      console.log('Import Done !');
    }
  }
}
