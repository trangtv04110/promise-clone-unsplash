var fs = require('fs');
var Promise = require("bluebird");
var request = require('request');
var https = require('https');
var gm = require('gm').subClass({imageMagick: true});
var options = {
	host: 'unsplash.com',
	path: '/'
}

function createThumbImg(img) {
	var newPath = img.replace('imgs', 'thumb');
	gm(img)
	.resize(240, 240)
	.noProfile()
	.write(newPath, function (err) {
		if (!err) console.log('Create thumb done: ' + newPath);
		else console.log("Error create thumb: " + err);
	});
}

function changeToGrayscale(img) {
	var newPath = img.replace('imgs', 'BW');
	gm(img)
	.noProfile()
	.type("Grayscale")
	.write(newPath, function (err) {
		if (!err) console.log('Change Grayscale mode done: ' + newPath);
		else console.log("Error change Grayscale mode: " + err);
	});
}

function getPhoto(photo) {
	return new Promise(function(fullfill, reject) {
		request.get(photo.url)
		.on('error', function(err) {
			err.photo = photo.url;
			reject(err);
		})
		.pipe(fs.createWriteStream(photo.name)
			.on('finish', function() {
				fullfill(photo.name);
			})
			.on('error', function(err) {
				reject(err);
			})
		);
	});
}

var httpsRequest = https.request(options, function (res) {
	if (fs.existsSync('./imgs/') === false) {
		fs.mkdirSync('./imgs/', 0777);
	}
	if (fs.existsSync('./BW/') === false) {
		fs.mkdirSync('./BW/', 0777);
	}
	if (fs.existsSync('./thumb/') === false) {
		fs.mkdirSync('./thumb/', 0777);
	}
	var data = '';
	res.on('data', function (chunk) {
		data += chunk;
	});
	res.on('end', function () {
		var results = data.match(/<img[^>]+src="([^">]+)/g);
		if(results)
		for (var i = 0; i < results.length; i++) {
			if(results[i].split('.').pop().toLowerCase() == 'svg') continue;
			var getPhotoPromise = getPhoto({ url: results[i].split('"').pop(), name: './imgs/' + i + '.jpg'});
			
			getPhotoPromise.then(function(response) {
				changeToGrayscale(response);
			}).catch(function(err) {
				console.error(err);
			});

			getPhotoPromise.then(function(response) {
				createThumbImg(response);
			}).catch(function(err) {
				console.error(err);
			});
		};
	});
});
httpsRequest.on('error', function (e) {
	console.log(e.message);
});
httpsRequest.end();