/// <reference path="../../typings/tsd.d.ts"/>
var EventProxy = require('eventproxy');
var events = require("events");
var emitter = new events.EventEmitter();
var models = require('../models');
var Log = models.Log;
var User = models.User;
var tools = require('../common/tools');
var Promise = require('promise');
var _ = require('lodash');


/**
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - log, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getLogById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['log', 'author'];
  proxy.assign(events, function (log, author) {
    if (!author) {
      return callback(null, null, null);
    }
    return callback(null, log, author);
  }).fail(callback);

  Log.findOne({ _id: id }, proxy.done(function (log) {
    if (!log) {
      proxy.emit('log', null);
      proxy.emit('author', null);
      proxy.emit('last_reply', null);
      return;
    }
    proxy.emit('log', log);

    User.getUserById(log.author_id, proxy.done('author'));
  }));
};

/**
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - log, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getAllLog = function (res, lastTime, callback) {
  var exec = null;
  if (lastTime) {
    exec = Log.find({ create_at: { $lt: new Date(lastTime) } }).sort({ create_at: -1 }).limit(10);
  } else {
    exec = Log.find({}).sort({ create_at: -1 }).limit(10)
  }
  exec.exec(function (err, logs) {
    if (err) {
      return callback(res, err);
    }
    if (logs.length === 0) {
      return callback(res, []);
    }
    // var ep = new EventProxy();
    // ep.after('get_attendance_teacher', logs.length, function (list) {
    //   callback(res, list);
    // });
    var ps = [];
    for (var i = 0; i < logs.length; i++) {
      var author_id = logs[i].author_id;
      var p = User.findOne({ _id: author_id }).exec();
      ps.push(p);
      // (function (i) {
      //   var author_id = logs[i].author_id;
      //   User.findById(author_id, function (err, user) {
      //     var log = logs[i];
      //     log.author = user;
      //     // emitter.emit('test', res,num);
      //     ep.emit('get_attendance_teacher', log);
      //   });
      // })(i)
    }
    Promise.all(ps).then(
      function (users) {
        for (var i = 0; i < logs.length; i++) {
          logs[i].author = users[i];
        }
        callback(res, logs);
      }

      //   users => {
      //   for (var i = 0; i < logs.length; i++) {
      //     logs[i].author = users[i];
      //   }
      // }
    )
  });
};


/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
  Log.count(query, callback);
};

/**
 * 根据关键词，获取主题列表
 * Callback:
 * - err, 数据库错误
 * - count, 主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getLogsByQuery = function (query, opt, callback) {
  query.deleted = false;
  Log.find(query, {}, opt, function (err, logs) {
    if (err) {
      return callback(err);
    }
    if (logs.length === 0) {
      return callback(null, []);
    }

    var proxy = new EventProxy();
    proxy.after('log_ready', logs.length, function () {
      logs = _.compact(logs); // 删除不合规的 log
      return callback(null, logs);
    });
    proxy.fail(callback);

    logs.forEach(function (log, i) {
      var ep = new EventProxy();
      ep.all('author', 'reply', function (author, reply) {
        // 保证顺序
        // 作者可能已被删除
        if (author) {
          log.author = author;
          log.reply = reply;
        } else {
          logs[i] = null;
        }
        proxy.emit('log_ready');
      });

      User.getUserById(log.author_id, ep.done('author'));
      // 获取主题的最后回复
      Reply.getReplyById(log.last_reply, ep.done('reply'));
    });
  });
};

// for sitemap
exports.getLimit5w = function (callback) {
  Log.find({ deleted: false }, '_id', { limit: 50000, sort: '-create_at' }, callback);
};

/**
 * 获取所有信息的主题
 * Callback:
 * - err, 数据库异常
 * - message, 消息
 * - log, 主题
 * - author, 主题作者
 * - replies, 主题的回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getFullLog = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['log', 'author', 'replies'];
  proxy
    .assign(events, function (log, author, replies) {
      callback(null, '', log, author, replies);
    })
    .fail(callback);

  Log.findOne({ _id: id, deleted: false }, proxy.done(function (log) {
    if (!log) {
      proxy.unbind();
      return callback(null, '此话题不存在或已被删除。');
    }
    at.linkUsers(log.content, proxy.done('log', function (str) {
      log.linkedContent = str;
      return log;
    }));

    User.getUserById(log.author_id, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, '话题的作者丢了。');
      }
      proxy.emit('author', author);
    }));

    Reply.getRepliesByLogId(log._id, proxy.done('replies'));
  }));
};

/**
 * 更新主题的最后回复信息
 * @param {String} logId 主题ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.updateLastReply = function (logId, replyId, callback) {
  Log.findOne({ _id: logId }, function (err, log) {
    if (err || !log) {
      return callback(err);
    }
    log.last_reply = replyId;
    log.last_reply_at = new Date();
    log.reply_count += 1;
    log.save(callback);
  });
};

/**
 * 根据主题ID，查找一条主题
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getLog = function (id, callback) {
  Log.findOne({ _id: id }, callback);
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceCount = function (id, callback) {
  Log.findOne({ _id: id }, function (err, log) {
    if (err) {
      return callback(err);
    }

    if (!log) {
      return callback(new Error('该主题不存在'));
    }
    log.reply_count -= 1;

    Reply.getLastReplyByTopId(id, function (err, reply) {
      if (err) {
        return callback(err);
      }

      if (reply.length !== 0) {
        log.last_reply = reply[0]._id;
      } else {
        log.last_reply = null;
      }

      log.save(callback);
    });

  });
};

exports.newAndSave = function (content, tab, authorId, callback) {
  var log = new Log();
  log.content = content;
  log.tab = tab;
  log.author_id = authorId;
  log.save(callback);
};
