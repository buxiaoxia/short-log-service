var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var bcryptjs  = require('bcryptjs');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./config')
var User = require('./lib/dao/user');
var routes = require('./lib/routes.js');
var auth = require('./lib/middlewares/auth');
var app = express(); 
var cors = require('cors');
//序列化用户id-session
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

//这里的username可以改成前端表单对应的命名，如：
// <form><input type="text" name="hehe">...</form>
//则这里将所有的username改为hehe
passport.use(new LocalStrategy({ usernameField: 'username' }, function(username, password, done) {
  //实现用户名或邮箱登录
  //这里判断提交上的username是否含有@，来决定查询的字段是哪一个
  var criteria = (username.indexOf('@') === -1) ? {username: username} : {email: username};
  User.findOne(criteria, function(err, user) {
    if (!user) return done(null, false, { message: '用户名或邮箱 ' + username + ' 不存在'});
    bcompare(password, hash, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: '密码不匹配' });
      }
    });
  });
}));


// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set('views', __dirname + '/www');
app.set('view engine', 'html');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(config.session_secret));
app.use(session({secret: config.session_secret}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use(express.static(path.join(__dirname, 'www')));


// custom middleware
app.use(auth.authUser);
// app.use(auth.blockUser());


// var isAuthenticated = function(req, res, next) {
//   if (req.isAuthenticated()) return next();
//   res.redirect('/login');
// };


//设置跨域访问
// app.all('*', function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//     res.header("X-Powered-By",' 3.2.1')
//     res.header("Content-Type", "application/json;charset=utf-8");
//     next();
// });
app.use(function(req, res, next){
    //设置可访问的域名 req.headers.orgin为nodejs下获取访问的域名地址
    // res.header("Access-Control-Allow-Origin", req.headers.origin);
    //设置可访问方法名
   // res.header('Access-Control-Allow-Methods', req.headers['Access-Control-Allow-Methods']);
    //设置可访问的头
    //res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    //设置cookie时长
    //res.header("Access-Control-Max-Age","1728000");
    //允许凭证,解决session跨域丢失问题
    res.header('Access-Control-Allow-Credentials', 'true');

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    next();
});

// 配置路由
routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
    // res.render('error', {
    //   message: err.message,
    //   error: err
    // });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
   res.send({
      message: err.message,
      error: {}
    });
  // res.render('error', {
  //   message: err.message,
  //   error: {}
  // });
});


module.exports = app;
