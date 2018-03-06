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

const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.set('views', path.join(__dirname, 'dist'));
// app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


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

if (!isProd) {
	//允许跨域
	app.use('*', function (req, res, next) {
		//如果设置此项，req.session将无法保存数据
		res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
		res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
		next();
	});
}

var queryWebErrorLog = require('./server/server.js');
app.use('/webErrorLog/', queryWebErrorLog);

const port = process.env.PORT || 8010;
app.listen(port, () => {
	if (!isProd) {
		opn('http://localhost:' + port)
	}
	console.log(`server started at localhost:${port}`)
})