'use strict';

var http = require('http');
var request = require('request');
var expect = require('chai').expect;
var manyInOne = require('../lib/index.js');
var querystring = require('querystring');

var SLICE_INDEX = 10;

http.createServer(function (req, res) {

	var url = req.url.split('?');
	req.query = querystring.parse(url[1]);
	url = url[0];

	if (url==='/request') {

		var buffer = new Buffer('{"a": "æææ"}');

		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(buffer.slice(0, SLICE_INDEX));

		process.nextTick(function () {
			res.end(buffer.slice(SLICE_INDEX, buffer.length));
		});
	}

	if (url==='/manyInOne') {

		manyInOne.handleManyInOneRequest(req, function (error, result) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify(result));
		});
	}

}).listen(1234, '127.0.0.1');


describe('unicodeIsBroken', function () {

	it('when using request', function (done) {
		request.get('http://127.0.0.1:1234/request', function(err, res) {
			expect(res.body).eql('{"a": "æææ"}');
			done(err);
		});
	});

	it('when using manyInOne', function (done) {
		request.get('http://127.0.0.1:1234/manyInOne?request=request', function(err, res) {
			expect(res.body).eql('{"request":{"a":"æææ"}}');
			done(err);
		});
	});
});
