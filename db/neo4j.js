const neo4j = require('neo4j-driver')
const { NEO4J_SESSION_PARAMS } = require('../constants')
/**
 * A singleton instance of the Neo4j Driver to be used across the app
 *
 * @type {neo4j.Driver}
 */
// tag::driver[]
let driver
// end::driver[]


/**
 * Initiate the Neo4j Driver
 *
 * @param {string} uri   The neo4j URI, eg. `neo4j://localhost:7687`
 * @param {string} username   The username to connect to Neo4j with, eg `neo4j`
 * @param {string} password   The password for the user
 * @returns {Promise<neo4j.Driver>}
 */
// tag::initDriver[]
async function initDriver(uri, username, password) {
  driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      username,
      password
    ),
    {
      maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
      maxConnectionPoolSize: 30000,
      minConnectionPoolSize: 15000,
      connectionAcquisitionTimeout: 60 * 60 * 1000,
      logging: {
        level: 'info',
        logger: (level, message) => {
          console.log('+++' + level + ' ' + message)
          /* log.debug("Active Connections: " + JSON.stringify(driver._pool._activeResourceCounts))
          log.debug("Idle Connections: " + JSON.stringify(driver._pool._pools))
          log.debug("All Connection count: " + JSON.stringify(Object.keys(driver._openConnections).length)) */
        }
      }
    }
  )

  driver.getServerInfo(NEO4J_SESSION_PARAMS)
  return driver
}
// end::initDriver[]

/**
 * Get the instance of the Neo4j Driver created in the
 * `initDriver` function
 *
 * @param {string} uri   The neo4j URI, eg. `neo4j://localhost:7687`
 * @param {string} username   The username to connect to Neo4j with, eg `neo4j`
 * @param {string} password   The password for the user
 * @returns {neo4j.Driver}
 */
// tag::getDriver[]
function getNeoDriver(uri, username, password) {
  return driver
}
// end::getDriver[]

/**
 * If the driver has been instantiated, close it and all
 * remaining open sessions
 *
 * @returns {void}
 */
// tag::closeDriver[]
function closeDriver() {
  return driver && driver.close()
}
// end::closeDriver[]

async function runSingleWriteQuery(queryToRun, session){
  let res = false;
  try {
    const result = await session.executeWrite(tx =>
      tx.run(queryToRun)
    );
  }catch(dbError){
    throw dbError;
  }finally {
    res = true;
    await session.close();
  }
  return res;
}


function buildNeoRedDependancies(nodeStr,nodeDep){

  let strMatchReq = '';
  let strMergeReq = '';
  if(Array.isArray(nodeDep)){
    if(nodeDep.length > 0){
      nodeDep.forEach((dependancy,nbDep) => {
        let level = dependancy.level
        
        /* if(nbDep > 0){
          strMatchReq +=','
          strMergeReq +=','
        } */

        //BUILDING MERGE FOR 2 linked nodes (optimize path for MERGE efficiency)
        strMatchReq += ` MERGE (${String.fromCharCode(65+level)}${nbDep}:${dependancy.labels}`;
        if(dependancy.matchValues.length > 0){
          dependancy.matchValues.forEach((matchVal,nbValM) => {
            if(nbValM === 0){
              strMatchReq += '{';
            }else{
              strMatchReq+= ',';
            }
            var property = matchVal.property.toString();
            var propValue = matchVal.value.toString();
            strMatchReq += `${property.replace(':','_')}:'${propValue.replace(/(?<!\\)'/g, "\\\'")}'`
            
          });
          strMatchReq+= '}';
        }
        strMatchReq += ')';
        strMatchReq += ` MERGE (L${String.fromCharCode(65+level)}${nbDep}:${nodeStr.split(':').slice(1).join(':')}`;
        

        //BUILDING MERGE
        dependancy.relations.forEach((relation,nbRel) => {
          let postMergeReq = '';
          strMergeReq += ` MERGE (${String.fromCharCode(65+level)}${nbDep})`
          if(relation.hasOwnProperty('direction')){
            if(relation.direction === 'to_node'){
              strMergeReq += `-[:${relation.types}`;
              postMergeReq += '->';
            }else if(relation.direction === 'from_node'){
              strMergeReq += `<-[:${relation.types}`;
              postMergeReq += '-';
            }else{
              strMergeReq += `-[:${relation.types}`;
              postMergeReq += '-';
            }
          }else{
            strMergeReq += `-[:${relation.types}`;
            postMergeReq += '-';
          }

          if(Array.isArray(relation.matchValues)){
            if(relation.matchValues.length > 0){
              relation.matchValues.forEach((matchVal,nbValM) => {
                if(nbValM === 0){
                  strMergeReq += '{';
                }else{
                  strMergeReq+= ',';
                }

                var property = matchVal.property.toString();
                var propValue = matchVal.value.toString();
                strMergeReq += `${property.replace(':','_')}:'${propValue.replace(/(?<!\\)'/g, "\\\'")}'`
                
              });
              strMergeReq += '}';
            }
          }
          strMergeReq += ']';
          strMergeReq += postMergeReq;

          strMergeReq += `(L${String.fromCharCode(65+level)}${nbDep})`;
          /* if(nbDep === 0){
            strMergeReq += nodeStr;
          }else{
            strMergeReq += nodeStr.split(':')[0];
            strMergeReq += ')';
          } */
        });
      });
    }
  }

  //console.log('StrDep = '+strMatchReq+' '+strMergeReq);
  return strMatchReq+' '+strMergeReq+'';
}



module.exports = {initDriver, getNeoDriver, closeDriver, buildNeoRedDependancies,runSingleWriteQuery}


