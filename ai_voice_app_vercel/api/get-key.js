/**
 * Vercel Serverless Function Alias: /api/get-key
 */
const handler = require('./key.js');
module.exports = handler;
module.exports.default = handler;
