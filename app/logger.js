/**
 * @module logger
 * @version 1.0.0
 * @author Peter Schmalfeldt <me@peterschmalfeldt.com>
 */

const config = require('./config')
const logger = require('logzio-nodejs')

let log
/* istanbul ignore next */
if (config.get('env') !== 'test') {
  /* istanbul ignore next */
  log = logger.createLogger({
    token: config.get('logzio.token'),
    type: config.get('logzio.type'),
    debug: config.get('logzio.debug')
  })
} else {
  log = {
    debug: () => {
      return true
    },
    error: () => {
      return true
    },
    info: () => {
      return true
    },
    log: () => {
      return true
    },
    warn: () => {
      return true
    }
  }
}

module.exports = log
