var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;

var debug = require('debug')('gitup');
var through = require('through');

function update_repo(repo_uri, destdir, cb) {

    debug('updating repo');

    if (fs.existsSync(destdir)) {
        return fetch_repo(destdir, cb);
    }

    var clone_args = ['clone', repo_uri, destdir];

    var opt = {
        stdio: 'inherit'
    };

    var child = spawn('git', clone_args, opt);

    child.on('exit', function(code) {
        debug('clone process exited with code %d', code);
        fetch_repo(destdir, cb);
    });
};

function fetch_repo(dir, cb) {
    var opt = {
        cwd: dir,
        stdio: 'inherit'
    };

    var child = spawn('git', ['pull'], opt);

    child.on('exit', function(code) {
        debug('pull process exited with code %d', code);
        cb();
    });
};

// clone a repo and keep it updated
// emit events when repo changes
var repoman = function(opt) {
    var ev = new EventEmitter();

    var uri = opt.giturii;
    var dir = opt.destdir;
    var reponame = opt.reponame;

    debug('repoman: %s -> %s', uri, dir);

    var stream = through(function(data) {
        ev.emit(data.type, data);
    });

    var write = function(obj) {
        stream.queue(obj);
    };

    var giturl = opt.giturl;
    var destdir = opt.destdir;

    function update() {
        update_repo(uri, dir, function(err) {
            if (err) {
                return stream.emit('error', err);
            }

            debug('updated repo');
            stream.emit('update', {
                dir: destdir
            });
        });
    }

    function updater(msg) {
        if (msg.repo !== reponame) {
            return;
        }

        update();
    }

    ev.on('repo', updater);

    stream.on('end', function() {
        ev.removeListener('repo', updater);
    });

    update();
    return stream;
};

module.exports = repoman;

