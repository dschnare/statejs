var $4web = require('4web');

$4web.build('test/js')
.done(function (error) {
	if (error) {
		console.error(error.toString());
	}
});