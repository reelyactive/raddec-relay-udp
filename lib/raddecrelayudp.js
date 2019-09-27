/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const dgram = require('dgram');
const Raddec = require('raddec');


const DEFAULT_SOURCES = [];
const DEFAULT_TARGETS = [];
const DEFAULT_RADDEC_PORT = 50001;
const DEFAULT_ENABLE_FORWARDING = true;
const DEFAULT_RADDEC_ENCODING_OPTIONS = {
    includeTimestamp: true,
    includePackets: true
};


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

    this.handleRaddec = options.raddecHandler;
    this.udpForwardCallback = options.udpForwardCallback || ( (err, raddec, target_address, target_port) => {} );
    this.enableHandling = (typeof this.handleRaddec === 'function');
    this.enableForwarding = DEFAULT_ENABLE_FORWARDING;
    if(options.hasOwnProperty('enableForwarding')) {
      this.enableForwarding = options.enableForwarding;
    }

    this.raddecEncodingOptions = options.raddecEncodingOptions ||
                                 DEFAULT_RADDEC_ENCODING_OPTIONS;

    let sources = options.sources || DEFAULT_SOURCES;
    let targets = options.targets || DEFAULT_TARGETS;

    this.sources = [];
    sources.forEach(function(source) {
      source.port = source.port || DEFAULT_RADDEC_PORT;
      if(source.hasOwnProperty('address')) {
        self.sources.push(createRaddecListener(self, source.address,
                                               source.port));
      }
    });

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
   * @param {Array} targetIndices The optional indices of targets to relay to.
   */
  relayRaddec(raddec, targetIndices) {
    let raddecHex = raddec.encodeAsHexString(this.raddecEncodingOptions);
    let raddecBuffer = Buffer.from(raddecHex, 'hex');
    let observeTargetIndices = Array.isArray(targetIndices);

    if (Array.isArray(targetIndices)) {
      targetIndices.filter((t) => {return t < this.targets.length;}).forEach((targetIndex) => {
        this.client.send(raddecBuffer, this.targets[targetIndex].port, this.targets[targetIndex].address,
          (err) => {
            this.udpForwardCallback(err, raddecBuffer, this.targets[targetIndex].address, this.targets[targetIndex].port);
          }
        );
      });
    }
  }

  /**
   * Handle the given source raddec depending on the relay configuration.
   * @param {Raddec} raddec The given Raddec instance.
   */
  handleSourceRaddec(raddec) {
    if(this.enableForwarding) {
      this.relayRaddec(raddec);
    }
    if(this.enableHandling) {
      this.handleRaddec(raddec);
    }
  }

}


/**
 * Create a UDP server to listen for raddecs from the given source and to
 * handle with the given function.
 * @param {RaddecRelayUdp} instance The relay instance.
 * @param {String} address The given address to listen on.
 * @param {Number} port The given port to listen on.
 */
function createRaddecListener(instance, address, port) {
  let server = dgram.createSocket('udp4');
  server.bind(port, address);

  server.on('message', function(msg) {
    try {
      let raddec = new Raddec(msg);

      if(raddec !== null) {
        instance.handleSourceRaddec(raddec);
      }
    }
    catch(error) {};
  });

  return server;
}


module.exports = RaddecRelayUdp;
