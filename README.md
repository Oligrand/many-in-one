many-in-one [![Build Status](https://secure.travis-ci.org/Oligrand/many-in-one.png)](http://travis-ci.org/Oligrand/many-in-one)
=========

Allows you to handle many http requests grouped into a single request's query

Example:

Suppose you have an API
- GET api/users
- GET api/customers
- GET api/countries

You can group all calls by doing one GET:
- GET api/resources ? users=api/users & customer=api/customers?id=23 & countries=api/countries

which will return an associative array with the results:
{users: {..}, customers: {..}, countries: {..} }

## Installation

  npm install many-in-one

## Usage

Use it by adding a new route inside your router:

```js
var manyInOne = require('many-in-one');

router.get('/api/users', function(req, res, next) {
  //api return users...
});

/** here /api/resources/ becomes the path were we handle multiple requests.
 * You can set the path to whatever you want. After you received the result
 * you can then return it in the response
 */
router.get('/api/resources', function (req, res, next) {
  manyInOne.handleManyInOneRequest(req, function (result) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(result));
    res.end();
  });
});

```

# Tests
Tests are written with [mocha](https://mochajs.org/)

```bash
npm test
```

# License
MIT
