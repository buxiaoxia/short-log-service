var index = require('./controllers/index');
var sign = require('./controllers/Sign');
var shortLogCtrl = require('./controllers/ShortLogsController.js');
var auth = require('./middlewares/auth');



module.exports = function (app) {
    app.get('/', index.index);

    app.post('/api/v1.0/signup', sign.signup);
    app.post('/api/v1.0/signin', sign.signin);
    app.post('/api/v1.0/shortLogs', auth.userRequired, shortLogCtrl.add);
    app.get('/api/v1.0/shortLogs', auth.userRequired, shortLogCtrl.all);
    // app.route('/shortLogs')
    //     .get(auth.userRequired,shortLogCtrl.all)
    //     .post(auth.userRequired,shortLogCtrl.add);
    // app.route('/shortLogs/:id')
    //     .put(auth.userRequired,shortLogCtrl.update)
    //     .delete(auth.userRequired,shortLogCtrl.del);
}





