var mongoose = require('mongoose');
var config   = require('../../config');
//var logger = require('../common/logger')

mongoose.connect(config.db, {
  server: {poolSize: 20}
}, function (err) {
  if (err) {
    console.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

// models
require('./user');
require('./log');
// require('./reply');
// require('./topic_collect');
// require('./message');

exports.User         = mongoose.model('User');
exports.Log        = mongoose.model('Log');
// exports.Reply        = mongoose.model('Reply');
// exports.TopicCollect = mongoose.model('TopicCollect');
// exports.Message      = mongoose.model('Message');
