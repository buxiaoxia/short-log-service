/**
 * config
 */

var path = require('path');

var config = {
  // mongodb 配置
  db: 'mongodb://118.178.16.192/xw-test',
  auth_cookie_name: 'short_log',
  session_secret:'abc',
};

if (process.env.NODE_ENV === 'test') {
  config.db = 'mongodb://127.0.0.1/node_club_test';
}

module.exports = config;
