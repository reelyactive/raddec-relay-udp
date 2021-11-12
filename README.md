raddec-relay-udp
================


Relay raddecs to and from remote servers over UDP
-------------------------------------------------

Relay raddecs to and from remote servers over UDP.  Can be used standalone, as described below, or behind a [raddec-relay](https://github.com/reelyactive/raddec-relay) interface to abstract away the details of the transport protocol.


Installation
------------

    npm install raddec-relay-udp


Quick Start
-----------

Clone this repository, install package dependencies with `npm install`, and then from the root folder run at any time:

    npm start

__raddec-relay-udp__ will listen for raddecs on port 50001 and print these to the console.


Hello raddec-relay-udp!
-----------------------

The following code will configure the relaying of raddecs to the localhost (127.0.0.1) and will create and send a single test raddec.

```javascript
const RaddecRelayUdp = require('raddec-relay-udp');
const Raddec = require('raddec');

const targets = [ { address: "127.0.0.1" } ];

let relay = new RaddecRelayUdp({ targets: targets });

let raddec = new Raddec({
    transmitterId: "aa:bb:cc:dd:ee:ff",
    transmitterIdType: Raddec.identifiers.TYPE_EUI48
});

relay.relayRaddec(raddec);  // Relay the raddec as configured
```


Configuration Examples
----------------------

__raddec-relay-udp__ supports a variety of configurations for receiving and/or relaying raddecs over UDP, as described in the following examples.

### Example: relay raddecs to remote server(s)

```javascript
const RaddecRelayUdp = require('raddec-relay-udp');

const targets = [
    { address: "12.34.56.78", port: 50001 },
    { address: "98.76.54.32", port: 50001 }
];

let relay = new RaddecRelayUdp({ targets: targets });

let raddec = ...;  // Typically locally decoded radio packets in this case

relay.relayRaddec(raddec);  // Relay the raddec to the remote servers
```

### Example: listen for and handle inbound raddecs

```javascript
const RaddecRelayUdp = require('raddec-relay-udp');

const sources = [ { address: "0.0.0.0", port: 50001 } ];

let relay = new RaddecRelayUdp({ sources: sources,
                                 raddecHandler: handleRaddec });

function handleRaddec(raddec) {
  // Do something with the received raddec
}
```

### Example: relay raddecs from source(s) to target(s)

```javascript
const RaddecRelayUdp = require('raddec-relay-udp');

const sources = [ { address: "0.0.0.0", port: 50001 } ];
const targets = [ { address: "12.34.56.78", port: 50001 } ];

let relay = new RaddecRelayUdp({ sources: sources,
                                 targets: targets });
```


Options
-------

__raddec-relay-udp__ supports the following options:

| Property               | Default | Description                            | 
|:-----------------------|:--------|:---------------------------------------|
| sources                | []      | Array of sources, each an object with address and port properties (default port is 50001) |
| targets                | []      | Array of targets, each an object with address and port properties (default port is 50001) |
| raddecEncodingOptions  | { includeTimestamp: true, includePackets: true } | Options for encoding raddecs sent to targets |
| enableForwarding       | true    | Forward raddecs from sources to targets (if both are present) |
| raddecHandler          | null    | Function to call when source raddec received |
| dnsRefreshMilliseconds | 60000   | Interval to resolve DNS for target hostnames |


License
-------

MIT License

Copyright (c) 2019 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
