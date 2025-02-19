/* The Clear BSD License
 *
 * Copyright (c) 2025 EdgeImpulse Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted (subject to the limitations in the disclaimer
 * below) provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 *
 *   * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 *   * Neither the name of the copyright holder nor the names of its
 *   contributors may be used to endorse or promote products derived from this
 *   software without specific prior written permission.
 *
 * NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY
 * THIS LICENSE. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
 * CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
 * BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
const cbor = require('cbor');
const fs = require('fs');
const crypto = require('crypto');
const Path = require('path');

// same as in main.cpp
const hmac_key = "fed53116f20684c067774ebf9e7bcbdc";

// empty signature (all zeros). HS256 gives 32 byte signature, and we encode in hex, so we need 64 characters here
let emptySignature = Array(64).fill('0').join('');

let data = {
    protected: {
        ver: "v1",
        alg: "HS256",
        iat: Math.floor(Date.now() / 1000) // epoch time, seconds since 1970
    },
    signature: emptySignature,
    payload: {
        device_name: "ac:87:a3:0a:2d:1b",
        device_type: "DISCO-L475VG-IOT01A",
        interval_ms: 10,
        sensors: [
            { name: "accX", units: "m/s2" },
            { name: "accY", units: "m/s2" },
            { name: "accZ", units: "m/s2" }
        ],
        values: [
            [ -9.81, 0.03, 1.21 ],
            [ -9.83, 0.04, 1.27 ],
            [ -9.12, 0.03, 1.23 ],
            [ -9.14, 0.01, 1.25 ]
        ]
    }
};

let encoded = cbor.encode(data);

// now calculate the HMAC and fill in the signature
let hmac = crypto.createHmac('sha256', hmac_key);
hmac.update(encoded);
let signature = hmac.digest().toString('hex');

// now find the empty signature in our encoded buffer
let sigIx = encoded.indexOf(emptySignature);
if (sigIx === -1) {
    throw 'Could not find empty signature in encoded CBOR object';
}

// replace the empty signature in the buffer, we don't re-encode the object
// as this might lead to canonicalization errors (although the chance here is small)
encoded = Buffer.concat([
    encoded.slice(0, sigIx),
    Buffer.from(signature, 'ascii'),
    encoded.slice(sigIx + signature.length)
]);

// representation of the buffer with spaces between bytes
console.log([...encoded].map(b => {
    let v = b.toString(16);
    return v.length === 1 ? '0' + v : v;
}).join(' '));

fs.writeFileSync(Path.join(__dirname, 'encoded.cbor'), encoded);
