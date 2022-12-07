const path = require('path'); 
const appArgs = process.argv.slice(2);
process.env.APP_ENV = appArgs[0];

require('dotenv').config({ path: path.join(__dirname, `./.env.${process.env.APP_ENV}`)}); 
// Load config from .env
const API_PREFIX = process.env.API_PREFIX || '/api';
const APP_PORT = process.env.APP_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'a secret key';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_SESSION_PARAMS = {database: 'neo4j'}
const APP_ENV = process.env.APP_ENV;


module.exports = { API_PREFIX, APP_PORT, JWT_SECRET, SALT_ROUNDS, NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_SESSION_PARAMS, APP_ENV};