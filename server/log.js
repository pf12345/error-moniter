var moment = require('moment');

module.exports = {
	error: function(err) {
		console.log('--------------------------->>>>>>>>>>');
		console.log('日志创建时间：' + moment().format('YYYY-MM-DD HH:mm:ss'));
		console.log(err);
		console.log('--------------------------->>>>>>>>>>');
		console.log('\n');
	},
	log: function(str, info) {
		console.log('--------------------------->>>>>>>>>>');
		console.log('日志创建时间：' + moment().format('YYYY-MM-DD HH:mm:ss'));
		console.log('日志说明：' + str);
		console.log('日志详情：' +JSON.stringify(info));
		console.log('--------------------------->>>>>>>>>>');
		console.log('\n');
	}
};