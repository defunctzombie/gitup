var through = require('through');

module.exports = function parse() {
    return through(function(data) {
        this.queue(JSON.parse(data));
    });
};

