var path = require('path');


exports.index = function (req, res) {
  if (!req.session || !req.session.user || !req.session.user._id) {
    //未登录 跳转到登录
    var html = path.normalize(__dirname + '/signin.html');
    res.sendfile(html);
  }else{
    var html = path.normalize(__dirname + '/app/home.html');
    res.sendfile(html);
  }
}
