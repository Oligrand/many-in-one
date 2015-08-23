'use strict';

var manyInOne = require('../lib/index.js');

var expect = require('chai').expect;
var nock = require('nock');
var httpMocks = require('node-mocks-http');

var host = 'domain.com';
var apiPath = '/api/';
var errorMessage = 'oh no';

var mockAPICall = function (apiType, result) {
  nock('http://'+host)
    .persist()
    .get(apiPath + apiType)
    .reply(200, result, {'Content-Type': 'application/json'});
};

var users = {'users':[
    {'id': 1, 'firstName':'John', 'lastName':'Doe'},
    {'id': 2, 'firstName':'Anna', 'lastName':'Smith'},
    {'id': 3, 'firstName':'Peter', 'lastName':'Jones'}
  ]};

var activeCustomers = {'customers':[
    {'id': 1, 'firstName':'Jane', 'lastName':'Paulsen', 'active': true},
    {'id': 3, 'firstName':'Dane', 'lastName':'Cook', 'active': true}
  ]};

var inactiveCustomers = {'customers':[
    {'id': 2, 'firstName':'Frank', 'lastName':'Donaldson', 'active': false}
  ]};

var countries = {'countries':[
    {'id': 1, 'name':'Denmark', 'abbreviation':'DK'},
    {'id': 2, 'name':'Sweden', 'abbreviation':'S'}
  ]};

before(function () {
  mockAPICall('users', users);
  mockAPICall('customers?active=true', activeCustomers);
  mockAPICall('customers?active=false', inactiveCustomers);
  mockAPICall('countries', countries);

  nock('http://'+host)
    .persist()
    .get(apiPath + 'books')
    .replyWithError(new Error(errorMessage));

  nock('https://'+host)
    .persist()
    .get(apiPath + 'users')
    .reply(200, users, {'Content-Type': 'application/json'});
});

describe('handleManyInOneRequest', function () {
  it('should return an empty response if the grouped request contains no single requests', function (done) {
     var req = httpMocks.createRequest({
       headers: { host: host },
       query: {}
     });

     manyInOne.handleManyInOneRequest(req, function (error, result) {
       expect(error).to.equal(null);
       var actual = JSON.stringify(result);
       var empty = JSON.stringify({});
       expect(actual).to.equal(empty);
       done();
     });
  });

  it('should return one key-value pair if a grouped request contains only one single request', function (done) {
    var req = httpMocks.createRequest({
      headers: { host: host },
      query: {'users': 'api/users'}
    });

    manyInOne.handleManyInOneRequest(req, function (error, result) {
      expect(error).to.equal(null);
      var actualUsers = JSON.stringify(result.users);
      var expectedUsers = JSON.stringify(users);
      expect(actualUsers).to.equal(expectedUsers);
      done();
    });
  });

  it('should return an associative array containing one key for every field-value pair' +
     ' of the query in the grouped request', function (done) {
     var req = httpMocks.createRequest({
       headers: { host: host },
       query: {
         'users': 'api/users',
         'customers': 'api/customers?active=true',
         'countries': 'api/countries',
       }
     });

     manyInOne.handleManyInOneRequest(req, function (error, result) {
       expect(error).to.equal(null);

       var actualUsers = JSON.stringify(result.users);
       var expectedUsers = JSON.stringify(users);
       expect(actualUsers).to.equal(expectedUsers);

       var actualCustomers = JSON.stringify(result.customers);
       var expectedCustomers = JSON.stringify(activeCustomers);
       expect(actualCustomers).to.equal(expectedCustomers);

       var actualCountries = JSON.stringify(result.countries);
       var expectedCountries = JSON.stringify(countries);
       expect(actualCountries).to.equal(expectedCountries);

       done();
     });
  });

  it('should return error if one of the single requests fails', function (done) {
    var req = httpMocks.createRequest({
      headers: { host: host },
      query: {
        'users': 'api/users',
        'books': 'api/books'
      }
    });

    manyInOne.handleManyInOneRequest(req, function (error, result) {
      expect(error.message).to.equal(errorMessage);
      done();
    });
  });

  it('should not fail if several single requests are requesting the same resource', function (done) {
     var req = httpMocks.createRequest({
       headers: { host: host },
       query: {
         'users': 'api/users',
         'activeCustomers': 'api/customers?active=true',
         'inactiveCustomers': 'api/customers?active=false',
       }
     });

     manyInOne.handleManyInOneRequest(req, function (error, result) {
       expect(error).to.equal(null);

       var actualUsers = JSON.stringify(result.users);
       var expectedUsers = JSON.stringify(users);
       expect(actualUsers).to.equal(expectedUsers);

       var actualActiveCustomers = JSON.stringify(result.activeCustomers);
       var expectedActiveCustomers = JSON.stringify(activeCustomers);
       expect(actualActiveCustomers).to.equal(expectedActiveCustomers);

       var actualInactiveCustomers = JSON.stringify(result.inactiveCustomers);
       var expectedInactiveCustomers = JSON.stringify(inactiveCustomers);
       expect(actualInactiveCustomers).to.equal(expectedInactiveCustomers);

       done();
     });
  });

});
