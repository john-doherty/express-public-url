# express-public-url

[![Tests](https://img.shields.io/github/actions/workflow/status/john-doherty/express-public-url/ci.yml?label=Tests)](https://github.com/john-doherty/express-public-url/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dm/express-public-url.svg?label=Downloads)](https://www.npmjs.com/package/express-public-url)

This little module adds `req.urlBase` and `req.publicUrl` to your express routes to make it easy to get the incoming request URL regardless of where you app us running - behind a proxy, load-balancer etc.

## Installation

```bash
npm install --save express-public-url
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

Pass `true` to add an `x-public-url` response header with the resolved URL, useful when debugging: `app.use(expressPublicUrl(true))`.

## Values exposed

All values are set per request, so concurrent requests never see each other's values.

On the request object:

| Property | Example |
| --- | --- |
| `req.urlBase` | `https://example.com` |
| `req.publicUrl` | `https://example.com/page?a=1` |

On `res.locals`, so they're available as template variables:

| Variable | Example |
| --- | --- |
| `protocol` | `https` |
| `domain` | `example.com` (includes the port if it's not the default) |
| `path` | `/page` (empty string for `/`) |
| `baseUrl` | `https://example.com` |
| `publicUrl` | `https://example.com/page?a=1` |

```html
<meta property="og:url" content="{{protocol}}://{{domain}}{{path}}">
```

## History

For change-log, check [CHANGELOG.md](CHANGELOG.md) and [releases](https://github.com/john-doherty/express-public-url/releases).

## License

Licensed under [MIT License](LICENSE) &copy; [John Doherty](https://twitter.com/mrjohndoherty)
