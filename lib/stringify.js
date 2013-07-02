var through = require('through');

module.exports = function stringify() {
    return through(function(data) {
        this.queue(JSON.stringify(data) + '\n');
    });
};

