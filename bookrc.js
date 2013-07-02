var log = require('book').default();

log.use(require('book-git')(__dirname));
log.use(require('book-raven')(process.env.SENTRY_DSN));

process.once('uncaughtException', function(err) {
    log.error(err);
    setTimeout(process.exit.bind(process, 1), 1000);
});

module.exports = log;

