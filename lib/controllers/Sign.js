/// <reference path="../../typings/node/node.d.ts"/>
var express = require('express');
var events = require('events');
var validator = require('validator');
var tools = require('../common/tools');
var User = require('../dao/user');
var authMiddleWare = require('../middlewares/auth');
var emitter = new events.EventEmitter();


emitter.on('prop_err', function (resp, msg) {
    resp.status(422);
    resp.send({ message: msg });
})

emitter.on('login_error', function (resp,login_error) {
    resp.status(403);
    resp.send({ message: login_error });
});



var sign = {
    signup: function (req, res) {
        var username = validator.trim(req.body.username).toLowerCase();
        var email = validator.trim(req.body.email).toLowerCase();
        var pass = validator.trim(req.body.password);
        var rePass = validator.trim(req.body.re_password);

        // 验证信息的正确性
        if ([username, pass, rePass, email].some(function (item) { return item === ''; })) {
            emitter.emit('prop_err', res, '信息不完整。');
            return;
        }
        if (username.length < 5) {
            emitter.emit('prop_err', res, '用户名至少需要5个字符。');
            return;
        }
        if (!tools.validateId(username)) {
            return emitter.emit('prop_err', res, '用户名不合法。');
        }
        if (!validator.isEmail(email)) {
            return emitter.emit('prop_err', res, '邮箱不合法。');
        }
        if (pass !== rePass) {
            return emitter.emit('prop_err', res, '两次密码输入不一致。');
        }
        // END 验证信息的正确性

        User.getUsersByQuery({
            '$or': [
                { 'username': username },
                { 'email': email }
            ]
        }, {}, function (err, users) {
            if (err) {
                return next(err);
            }
            if (users.length > 0) {
                emitter.emit('prop_err', res, '用户名或邮箱已被使用。');
                return;
            }

            tools.bhash(pass, function (err, passhash) {
                // create gravatar
                var avatarUrl = User.makeGravatar(email);
                User.newAndSave(username, username, passhash, email, avatarUrl, function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.status(201);
                    res.send({ message: '恭喜，注册成功，请重新登录' });
                });

            });
        });
    },
    signin: function (req, res) {
        var loginname = validator.trim(req.body.username);
        var pass = validator.trim(req.body.password);

        if (!loginname || !pass) {
            emitter.emit('login_error', res, '信息不完整。');
            return;
        }

        var getUser;
        if (loginname.indexOf('@') !== -1) {
            getUser = User.getUserByMail;
        } else {
            getUser = User.getUserByLoginName;
        }


        getUser(loginname, function (err, user) {
            if (err) {
                return emitter.emit('login_error', res, err);
            }
            if (!user) {
                return emitter.emit('login_error', res, '用户不存在');
            }
            var passhash = user.password;
            tools.bcompare(pass, passhash, function (err,bool) {
                if (!bool) {
                    return emitter.emit('login_error', res, '密码错误');
                }
                // store session cookie
                authMiddleWare.gen_session(user, res);
                //成功跳转
                res.status(200);
                res.send({meesage:'登录成功',user:user});
            });
        });
    }
}



module.exports = sign;




