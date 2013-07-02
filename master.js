var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var net = require('net');

var debug = require('debug')('gitup');
var pushover = require('pushover');
var through = require('through');
var charsplit = require('char-split');

var parse = require('./lib/parse');
var stringify = require('./lib/stringify');

function Master(opt) {
    if (!(this instanceof Master)) {
        return new Master(opt);
    }

    var self = this;
    var repos = self._repos = pushover('/tmp/repos');
    self._opt = opt;

    repos.on('push', function (push) {
        debug('push ' + push.repo + '/' + push.commit + ' (' + push.branch + ')');
        push.accept();
    });

    repos.on('fetch', function (fetch) {
        debug('fetch ' + fetch.commit);
        fetch.accept();
    });
}

Master.prototype.handle = function(req, res) {
    var self = this;

    // TODO return info for running clients
    if (req.url === '/_info') {}

    if (!req.headers.authorization) {
        res.statusCode = 401;
        res.setHeader('www-authenticate', 'Basic');
        res.end();
        return;
    }

    var actual_auth = req.headers.authorization;

    var exp_auth = self._opt.gituser + ':' + self._opt.secret;
    exp_auth = 'Basic ' + Buffer(exp_auth).toString('base64');

    if (actual_auth !== exp_auth) {
        res.statusCode = 403;
        res.end();
        return;
    }

    self._repos.handle(req, res);
};

Master.prototype.handleUpgrade = function(req, socket, head) {
    var self = this;

    socket.setEncoding('utf8');

    socket
    .pipe(charsplit())
    .pipe(parse())
    .pipe(self.control())
    .pipe(stringify())
    .pipe(socket);
};

// create a control channel stream
Master.prototype.control = function() {
    var self = this;

    var authenticated = false;

    var mplex = new EventEmitter();

    var stream = through(function(data) {
        mplex.emit(data.type, data);
    });

    var write = function(obj) {
        stream.emit('data', obj);
    };

    mplex.on('auth', function(msg) {
        if (msg.secret !== self._opt.secret) {
            stream.end();
        }
    });

    var push_handler = function(push) {
        // need to wait a moment otherwise immediate fetch fails
        // TODO file issue with pushover?
        setTimeout(function() {
            write({
                type: 'repo',
                repo: push.repo
            });
        }, 1000);
    }

    self._repos.on('push', push_handler);

    stream.on('end', function() {
        self._repos.removeListener('push', push_handler);
    });

    return stream;
};

module.exports = Master;
