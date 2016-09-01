var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var User = require('../dao/user');
var events = require('events');
var config = require('../../config');
var emitter = new events.EventEmitter();

emitter.on('get_user', function (user, req, res, next) {
    if (!user) {
        return next();
    }
    user = res.locals.current_user = req.session.user = new UserModel(user);
    next();
    // if (config.admins.hasOwnProperty(user.loginname)) {
    //     user.is_admin = true;
    // }
});


/**
 * 需要管理员权限
 */
exports.adminRequired = function (req, res, next) {
    if (!req.session.user) {
        return res.render('notify/notify', { error: '你还没有登录。' });
    }

    if (!req.session.user.is_admin) {
        return res.render('notify/notify', { error: '需要管理员权限。' });
    }

    next();
};

/**
 * 需要登录
 */
exports.userRequired = function (req, res, next) {
    // if (!req.session || !req.session.user || !req.session.user._id) {
    //     return res.status(403).send('forbidden!');
    // }
    if (!req.headers) {
        return res.status(403).send('forbidden!');
    }

    User.getUserById(req.headers.authuser, function (err, user) {
        if (err || !user) {
            return res.status(403).send('forbidden!');
        }
        req.session.current_user = user;
        next();
    });

};

exports.blockUser = function () {
    return function (req, res, next) {
        if (req.path === '/signout') {
            return next();
        }

        if (req.session.user && req.session.user.is_block && req.method !== 'GET') {
            return res.status(403).send('您已被管理员屏蔽了。有疑问请联系 @alsotang。');
        }
        next();
    };
};


function gen_session(user, res) {
    var auth_token = user._id + '$$$$'; // 以后可能会存储更多信息，用 $$$$ 来分隔
    // var auth_token = {
    //     _id:user._id,
    //     username:user.username,
    //     avatar:user.avatar
    // }
    var opts = {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        signed: true,
        httpOnly: false
    };
    res.cookie(config.auth_cookie_name, auth_token, opts); //cookie 有效期7天
}

exports.gen_session = gen_session;

// 验证用户是否登录
exports.authUser = function (req, res, next) {

    // Ensure current_user always has defined.
    res.locals.current_user = null;

    if (req.session.user) {
        emitter.emit('get_user', req.session.user, req, res, next);
    } else {
        var auth_token = req.signedCookies[config.auth_cookie_name];
        if (!auth_token) {
            return next();
        }
        var auth = auth_token.split('$$$$');
        var user_id = auth[0];
        // var user_id = auth_token._id;
        User.getUserById(user_id, function (err, user) {
            emitter.emit('get_user', user, req, res, next);
        });
    }
};