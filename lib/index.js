'use strict';

var request = require('request');
var async = require('async');
var stream = require('stream');

/**
 * Handle individual requests nested inside a single request and return all the results
 *
 * @param  {String} req The request object received
 * @param  {func} callback The callback function to call when the grouped result is ready
 * @return {Object} associative array containing each individual result
 */
exports.handleManyInOneRequest = function (req, callback) {
  var query = req.query;
  var groupedResponse = {};

  //Build function to handle each individual request
  var singleAPIRequest = function (resourceTypeKey, singleRequestCallback) {
    //Create stream to get individual response and put it into the grouped response
    var resultstWritestream = new stream.Stream();
    resultstWritestream.writable = true;
    var fullData = '';
    resultstWritestream.write = function (dataChunk) {
      fullData += dataChunk;
      return true;
    };
    resultstWritestream.end = function (data) {
      //we parse the individual response since the grouped response will be stringify
      var parsedData = JSON.parse(fullData);
      groupedResponse[resourceTypeKey] = parsedData;
    };

    //Construct full URL for the individual request
    var host = req.headers.host + '/';
    var fullURL = 'http://' + host + query[resourceTypeKey];

    //Execute individual request and pipe the result into the result write stream
    request(fullURL, function (error, response, body) {
      if(error) {
        return singleRequestCallback(error);
      } else {
        singleRequestCallback(null, body);
      }
    }).pipe(resultstWritestream);
  };

  //Build an array containing a function for each single requests needed to be executed
  var apiRequests = [];
  for (var resourceTypeKey in query) {
    apiRequests.push(singleAPIRequest.bind(null, resourceTypeKey));
  }

  //Execute all individual requests in parallel and send back the grouped reponse in the end
  async.parallel(apiRequests, function(error) {
    if (error) {
      callback(error);
    } else {
      callback(null, groupedResponse);
    }
  });
};
