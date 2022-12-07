const fs = require('node:fs');
const {initDriver, getNeoDriver} = require('./db/neo4j.js')
const {NEO4J_PASSWORD, NEO4J_URI, NEO4J_USERNAME, NEO4J_SESSION_PARAMS} = require('./constants.js')
const chokidar = require('chokidar')
const hypoLoader = require ('./services/hypoLoader.services')
const express = require('express');
const app = express();

//middlewares
app.use(express.json());

const watcher = chokidar.watch('.', {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    usePolling: false, // true for network files
    ignoreInitial: true
  });

watcher
  .on('add', path => {
    const hyLoaderDOPLER = new hypoLoader(getNeoDriver())
    hyLoaderDOPLER.importFileHypoDOPLER(path);
  }
  /* fs.readFile(path, function(err, data) {
    if (err) throw err;
    const hyLoaderDOPLER = new hypoLoader(getNeoDriver())
    hyLoaderDOPLER.importFileHypoDOPLER(data); */
)
  /*.on('change', path => console.log(`File ${path} has been changed`))
  .on('unlink', path => console.log(`File ${path} has been removed`))
  .on('addDir', path => console.log(`Directory ${path} has been added`))
  .on('unlinkDir', path => console.log(`Directory ${path} has been removed`)) */
  .on('error', error => console.log(`File watcher : KO -> ${error}`))
  .on('ready', () => console.log('File watcher : OK'));

initDriver(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD).then(async(driver) => {
  try{
    const session = driver.session(NEO4J_SESSION_PARAMS); 
    const result = await session.executeRead(
      async tx => {
        return tx.run(`MATCH(n) RETURN n LIMIT 25`)
      }
    )

    /* const records = result.records
    for (let i = 0; i < records.length; i++) {
      console.log('Record : '+records[i].get(0))
    } */
    
    await session.close()
    console.log('Neo4J database : OK');
  }catch(err){
    console.log('Neo4J database : KO -> '+err);
  }
});




