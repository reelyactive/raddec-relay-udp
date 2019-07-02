/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const dgram = require('dgram');


const DEFAULT_TARGETS = [];
const DEFAULT_RADDEC_PORT = 50001;


/**
 * RaddecRelayUdp Class
 * Interface for relaying raddecs to/from remote servers.
 */
class RaddecRelayUdp {

  /**
   * RaddecRelayUdp constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.raddecOptions = {
        includeTimestamp: true, // TODO: take from options
        includePackets: true    // TODO: take from options
    }

    let targets = options.targets || DEFAULT_TARGETS;

    this.targets = [];
    targets.forEach(function(target) {
      target.port = target.port || DEFAULT_RADDEC_PORT;
      if(target.hasOwnProperty('address')) {
        self.targets.push(target);
      }
    });

    this.client = dgram.createSocket('udp4');
  }

  /**
   * Relay the given raddec.
   * @param {Raddec} raddec The given Raddec instance.
   */
  relayRaddec(raddec) {
    let self = this;
    let raddecHex = raddec.encodeAsHexString(this.raddecOptions);
    let raddecBuffer = Buffer.from(raddecHex, 'hex');

    this.targets.forEach(function(target) {
      self.client.send(raddecBuffer, target.port, target.address,
                       function(err) { });
    });
  }

}


module.exports = RaddecRelayUdp;
