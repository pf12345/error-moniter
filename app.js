const path = require('path')
const express = require('express')
const compression = require('compression')
const opn = require('opn');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const resolve = file => path.resolve(__dirname, file)

const serve = (path, cache) => express.static(resolve(path), {
	maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60
})

const isProd = true

const app = express()

app.set('views', path.join(__dirname, 'dist'));
app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'ejs');

app.use('/public', serve('./public', true))
app.use('/static', serve('./dist/static', true))

app.use(bodyParser.json({
	limit: '150mb'
}));
app.use(bodyParser.urlencoded({
	limit: '150mb',
	extended: false
}));
app.use(cookieParser());

app.use(compression({
	threshold: 0
}))

//允许跨域
app.use('*', function (req, res, next) {
	//如果设置此项，req.session将无法保存数据
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
	res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
	next();
});

app.use('/webErrorLog/', require('./server/server.js'));
app.use('/', require('./server/index.js'));
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
const port = process.env.PORT || 8010;
app.listen(port, () => {
	if (!isProd) {
		opn('http://localhost:' + port)
	}
	console.log(`server started at localhost:${port}`)
})