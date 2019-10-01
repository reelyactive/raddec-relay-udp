/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


const dgram = require('dgram');
const dns = require('dns');
const Raddec = require('raddec');


const DEFAULT_SOURCES = [];
const DEFAULT_TARGETS = [];
const DEFAULT_RADDEC_PORT = 50001;
const DEFAULT_ENABLE_FORWARDING = true;
const DEFAULT_RADDEC_ENCODING_OPTIONS = {
    includeTimestamp: true,
    includePackets: true
};
const DEFAULT_DNS_REFRESH_MILLISECONDS = 60000;

const DEFAULT_SERVER_RADDEC_ERROR_CALLBACK = (error) => {};

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

    this.dnsRefreshMilliseconds = options.dnsRefreshMilliseconds ||
                                  DEFAULT_DNS_REFRESH_MILLISECONDS;
    this.raddecEncodingOptions = options.raddecEncodingOptions ||
                                 DEFAULT_RADDEC_ENCODING_OPTIONS;

    let sources = options.sources || DEFAULT_SOURCES;
    let targets = options.targets || DEFAULT_TARGETS;

    this.raddecErrorCallback = (typeof options.raddecErrorCallback === 'function') ? options.raddecErrorCallback : DEFAULT_SERVER_RADDEC_ERROR_CALLBACK;

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

    this.resolvedHostnames = new Map();
    this.client = dgram.createSocket({ type: 'udp4', lookup: lookup });

    // Look up and resolve the given hostname (like dns.lookup() with memory).
    // TODO: support IPv6 and full set of options in future
    function lookup(hostname, options, callback) {
      let isLookupRequired = !self.resolvedHostnames.has(hostname);
      let isRefreshRequired = false;
      let resolution;

      if(!isLookupRequired) {
        resolution = self.resolvedHostnames.get(hostname);
        let elapsedTime = Date.now() - resolution.timestamp;
        isRefreshRequired = (elapsedTime > self.dnsRefreshMilliseconds);
      }

      if(isLookupRequired || isRefreshRequired) {
        dns.lookup(hostname, options, function(err, address, family) {
          if(err) {
            return callback(err);
          }
          resolution = { address: address,
                         family: family,
                         timestamp: Date.now() };
          self.resolvedHostnames.set(hostname, resolution);
          return callback(null, address, family);
        });
      }
      else {
        return callback(null, resolution.address, resolution.family);
      }
    }
  }

  /**
   * Relay the given raddec.
   * @param {Raddec} raddec The given Raddec instance.
   * @param {Array} targetIndices The optional indices of targets to relay to.
   */
  relayRaddec(raddec, targetIndices) {
    let raddecHex = raddec.encodeAsHexString(this.raddecEncodingOptions);
    let raddecBuffer = Buffer.from(raddecHex, 'hex');
    

    if (Array.isArray(targetIndices)) {
      // Send to a subset of targets
      targetIndices.filter((t) => {t < this.targets.length}).forEach((targetIndex) => {
        this.client.send(raddecBuffer, this.targets[targetIndex].port, this.targets[targetIndex].address,
          (err) => {
            this.tcpForwardErrorCallback(err, raddecBuffer, this.targets[targetIndex].address, this.targets[targetIndex].port);
          }
        );
      });
    } else {
      // Send to all targets
      this.targets.forEach((target) => {
        this.client.send(raddecBuffer, target.port, target.address,
          (err) => {
            this.tcpForwardErrorCallback(err, raddecBuffer, target.address, target.port);
          }
        );
      });
    }
  }

  /**
   * Handle the given source raddec depending on the relay configuration.
   * @param {Raddec} raddec The given Raddec instance.
   */
  handleSourceRaddec(raddec, rinfo) {
    if(this.enableForwarding) {
      this.relayRaddec(raddec);
    }
    if(this.enableHandling) {
      this.handleRaddec(raddec, rinfo);
    }
  }

  terminate() {
    this.enableForwarding = false;
    this.enableHandling = false;
    let tmp = this.sources;
    this.sources = [];
    tmp.forEach((source) => source.close());
    this.targets = [];
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

  server.on('message', function(msg, rinfo) {
    try {
      let raddec = new Raddec(msg);

      if(raddec !== null) {
        instance.handleSourceRaddec(raddec, rinfo);
      }
    }
    catch(error) {
      instance.raddecErrorCallback(error, msg, rinfo);
    };
  });

  return server;
}


module.exports = RaddecRelayUdp;
