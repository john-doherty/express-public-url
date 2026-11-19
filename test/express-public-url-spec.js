var fs = require('fs');
var path = require('path');
var express = require('express');
var request = require('supertest');
var expressPublicUrl = require('../index.js');
var app = null;
var server = null;

// forwarded headers set by a typical https proxy
var proxyHeaders = {
    'x-forwarded-proto': 'https',
    'x-forwarded-host': 'example.com',
    'x-forwarded-port': '443'
};

// minimal async view engine: replaces {{key}} with the value from the render locals
function renderTxt(filePath, options, callback) {
    fs.readFile(filePath, 'utf8', function (err, template) {
        if (err) return callback(err);
        callback(null, template.replace(/{{(\w+)}}/g, function (match, key) {
            return options[key];
        }));
    });
}

describe('express-public-url', function () {

    beforeEach(function(done){

        // create an express app
        app = express();

        // listen on 127.0.0.1 explicitly; supertest's default listen(0) binds to :: and
        // on macOS can collide with another process already listening on 127.0.0.1:<port>
        server = app.listen(0, '127.0.0.1', done);
    });

    afterEach(function(done){
        server.close(done);
    });

    it('should render each concurrent request with its own path and publicUrl', function(done){

        var paths = [];
        var bodies = [];
        var remaining = 100;

        for (var i = 0; i < remaining; i++) {
            paths.push('/page-' + i);
        }

        app.set('views', path.join(__dirname, 'views'));
        app.engine('txt', renderTxt);
        app.use(expressPublicUrl());

        // render after a random delay so requests overlap
        app.use(function (req, res) {
            setTimeout(function () {
                res.render('echo.txt');
            }, Math.random() * 20);
        });

        // fire all requests at once and compare once every response is back
        paths.forEach(function (p, index) {
            request(server).get(p)
                .set(proxyHeaders)
                .end(function(err, res){

                    bodies[index] = err ? err.message : res.text;

                    if (--remaining === 0) {
                        expect(bodies).toEqual(paths.map(function (p) {
                            return p + ' https://example.com' + p;
                        }));
                        done();
                    }
                });
        });
    });

    it('should not write per-request values to app.locals', function(done){

        app.use(expressPublicUrl());
        app.use(function (req, res) {
            res.end();
        });

        request(server).get('/page')
            .expect(200)
            .end(function(err, res){

                var leakedKeys = ['protocol', 'domain', 'path', 'baseUrl', 'publicUrl'].filter(function (key) {
                    return key in app.locals;
                });

                expect(leakedKeys).toEqual([]);
                done(err);
            });
    });

    describe('with echo route', function () {

        beforeEach(function(){

            // hook up middleware and echo the resolved values back as json
            app.use(expressPublicUrl());
            app.use(function (req, res) {
                res.json({ urlBase: req.urlBase, publicUrl: req.publicUrl, locals: res.locals });
            });
        });

        it('should use x-forwarded-proto and x-forwarded-host for req.urlBase', function(done){

            request(server).get('/page')
                .set(proxyHeaders)
                .expect(200)
                .end(function(err, res){

                    expect(res.body.urlBase).toEqual('https://example.com');
                    done(err);
                });
        });

        it('should include the path and query string in req.publicUrl', function(done){

            request(server).get('/page?a=1')
                .set(proxyHeaders)
                .expect(200)
                .end(function(err, res){

                    expect(res.body.publicUrl).toEqual('https://example.com/page?a=1');
                    done(err);
                });
        });

        it('should use the first value of comma-separated forwarded headers', function(done){

            request(server).get('/page')
                .set('x-forwarded-proto', 'https,http')
                .set('x-forwarded-host', 'example.com,proxy.internal')
                .set('x-forwarded-port', '8443,80')
                .expect(200)
                .end(function(err, res){

                    expect(res.body.publicUrl).toEqual('https://example.com:8443/page');
                    done(err);
                });
        });

        it('should drop default port 443 for https', function(done){

            request(server).get('/page')
                .set(proxyHeaders)
                .expect(200)
                .end(function(err, res){

                    expect(res.body.publicUrl).toEqual('https://example.com/page');
                    done(err);
                });
        });

        it('should drop default port 80 for http', function(done){

            request(server).get('/page')
                .set('x-forwarded-proto', 'http')
                .set('x-forwarded-host', 'example.com')
                .set('x-forwarded-port', '80')
                .expect(200)
                .end(function(err, res){

                    expect(res.body.publicUrl).toEqual('http://example.com/page');
                    done(err);
                });
        });

        it('should expose template values on res.locals', function(done){

            request(server).get('/page')
                .set(proxyHeaders)
                .expect(200)
                .end(function(err, res){

                    expect(res.body.locals).toEqual({
                        protocol: 'https',
                        domain: 'example.com',
                        path: '/page',
                        baseUrl: 'https://example.com',
                        publicUrl: 'https://example.com/page'
                    });
                    done(err);
                });
        });

        it('should set res.locals.path to an empty string for the root path', function(done){

            request(server).get('/')
                .expect(200)
                .end(function(err, res){

                    expect(res.body.locals.path).toEqual('');
                    done(err);
                });
        });
    });

    it('should set the x-public-url header when debugMode is true', function(done){

        app.use(expressPublicUrl(true));
        app.use(function (req, res) {
            res.end();
        });

        request(server).get('/page')
            .set(proxyHeaders)
            .expect(200)
            .end(function(err, res){

                expect(res.headers['x-public-url']).toEqual('https://example.com/page');
                done(err);
            });
    });
});
