'use strict';

/**
 * Parses headers to generate the correct public url for the application
 * @param {bool} debugMode - true if debugging - adds x-public-url to http headers allowing developer to see resolved domain
 * @returns {function} express middleware
 */
module.exports = function(debugMode) {

    return function(req, res, next) {

        var hostHeaderValue = String(req.headers.host || '');
        var protocol = (req.headers['x-forwarded-proto'] || '').split(',')[0] || req.protocol || 'http';
        var host = (req.headers['x-forwarded-host'] || '').split(',')[0] || hostHeaderValue.replace(/:[0-9]+/, '');
        var port = (req.headers['x-forwarded-port'] || '').split(',')[0] || req.app.settings.port || (hostHeaderValue.match(/:([0-9]+)/) || [])[1] || '';
        var resource = (req.url === '/') ? '' : req.url;

        // clear default ports
        port = (protocol === 'https' && port === '443') ? '' : port;
        port = (protocol === 'http' && port === '80') ? '' : port;

        // add port number of present
        host += ((port !== '') ? ':' + port : '');

        var publicUrl = protocol + '://' + host + resource;

        // expose as a header in debug mode for testing
        if (debugMode) {
            res.setHeader('x-public-url', publicUrl);
        }

        // per-request template values (use res.locals because app.locals is shared by all requests)
        res.locals.protocol = protocol;
        res.locals.domain = host;
        res.locals.path = (req.path !== '/') ? req.path : '';
        res.locals.baseUrl = protocol + '://' + host;
        res.locals.publicUrl = publicUrl;

        req.urlBase = protocol + '://' + host;

        // make the public Url available on both request objects
        req.publicUrl = publicUrl;

        next();
    };
};
