# express-public-url

[![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/MrJohnDoherty.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/MrJohnDoherty)

Parses HTTP headers to generate the correct public url for the application.

## Installation

```bash
$ npm install --save express-public-url
```

## Usage

```js
var express = require('express');
var app = express();

// require module
var expressPublicUrl = require('express-public-url');

// add middleware to get the public Url from either the http proxy headers or current request host
app.use(expressPublicUrl());
```

From within your routes you can now access the requested base URL via `req.urlBase`, regardless of where port/server your internal node service sits on.

## History

For change-log, check [releases](https://github.com/john-doherty/express-public-url/releases).

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)