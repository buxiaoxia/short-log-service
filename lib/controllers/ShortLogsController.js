/// <reference path="../../typings/tsd.d.ts"/>
var express = require('express');
var Log = require('../dao/log');
var User = require('../dao/user');
var tools = require('../common/tools.js');

var shortLogCtrl = {
    all: function (req, res) {
        var lastTime = null;
        if(req.query.lastTime){
            lastTime = req.query.lastTime;
        };
        
        Log.getAllLog(res, lastTime, function (resp, logs) {
            var shortLogs = [];
            for (var i = 0; i < logs.length; i++) {
                var log = logs[i];
                var shortLog = {};
                shortLog.author = {};
                shortLog.content = log._doc.content;
                shortLog.pic = log._doc.pic;
                shortLog.create_at = log._doc.create_at;
                shortLog.like_count = log._doc.like_count;
                shortLog.difftime = tools.getDateDiff(log._doc.create_at);
                shortLog.reply_count = log._doc.reply_count;
                shortLog.author.username = log.author._doc.username;
                shortLog.author.avatar = log.author._doc.avatar;
                shortLogs.push(shortLog);
            }

            resp.status(200);
            resp.send({ 'shortLogs': shortLogs });
        })
    },
    add: function (req, res) {
        var data = req.body;
        console.log(data);
        Log.newAndSave(data.content, null, req.session.current_user._id, function (err, data) {
            if (err) {
                return next(err);
            }
            var shortLog = {};
            shortLog.author = {};
            shortLog.content = data.content;
            shortLog.pic = data.pic;
            shortLog.create_at = data.create_at;
            shortLog.difftime = tools.getDateDiff(data.create_at);
            shortLog.like_count = 0;
            shortLog.reply_count = 0;
            shortLog.author.username = req.session.current_user.username;
            shortLog.author.avatar = req.session.current_user.avatar;
            res.status(201);
            //返回对象
            res.send({ 'shortLog': shortLog });
        })
    },
    update: function (req, res) {

    },
    del: function (req, res) {

    }

}


module.exports = shortLogCtrl;





