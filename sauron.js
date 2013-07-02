var fs = require('fs');
var spawn = require('child_process').spawn;
var debug = require('debug')('gitup');

var Sauron = function(dir) {
    if (!(this instanceof Sauron)) {
        return new Sauron(dir);
    }

    var self = this;
    self._dir = dir;
    self._child = undefined;
    self._kill_timeout = undefined;
};

Sauron.prototype.restart = function() {
    debug('restart request');

    var self = this;
    var dir = self._dir;

    var pkgfile = JSON.parse(fs.readFileSync(dir + '/package.json'));

    if (!pkgfile.scripts || !pkgfile.scripts.start) {
        return debug('no start script');
    }

    self._run(dir, pkgfile.scripts.start);
};

Sauron.prototype._run = function(dir, script) {
    var self = this;

    if (self._child) {
        debug('killing old child process');
        process.kill(self._child.pid, 'SIGTERM');

        // process has 3 seconds to die gracefully via SIGTERM
        self._kill_timeout = setTimeout(function() {
            process.kill(self._child.pid, 'SIGKILL');
        }, 3000);
        return;
    }

    var opt = {
        cwd: dir,
        stdio: 'inherit'
    };

    (function restart() {
        clearTimeout(self._kill_timeout);

        debug('start/restart child');

        var split = script.split(' ');
        var cmd = split.shift();

        var child = self._child = spawn(cmd, split, opt);

        debug('started child %d', child.pid);

        child.on('exit', function() {
            debug('child exited');

            // TODO failed restarts
            restart();
        });
    })();
};

module.exports = Sauron;

