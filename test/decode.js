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

// read the file we just generated
let buffer = fs.readFileSync(Path.join(__dirname, 'encoded.cbor'));

// decode it
let decoded = cbor.decode(buffer);
console.log('Full object', decoded);

// verify the protected header. The C library can also output 'none' signatures but this is not recommended.
if (!decoded.protected) {
    throw 'Missing protected';
}
if (decoded.protected.alg !== 'HS256') {
    throw 'Only "HS256" supported at the moment';
}
if (decoded.protected.ver !== 'v1') {
    throw 'Invalid version, expecting "v1"';
}

// so to verify that this is correctly signed, we need to find where the signature is in the original stream...
let sig_ix = buffer.lastIndexOf(decoded.signature);
let sig_length = buffer[sig_ix - 1];

if (sig_length !== 64) { // hex encoded 32 bytes
    throw 'Signature length is not 64, but ' + sig_length + ' (note: indefinite length strings are not supported)';
}

// so we set the signature to "000000" (etc.) in ascii
for (let ix = sig_ix; ix < sig_ix + sig_length; ix++) {
    buffer[ix] = '0'.charCodeAt(0); // set to ascii 0
}

// then calculate the HMAC...
let hmac = crypto.createHmac('sha256', hmac_key);
hmac.update(buffer);
let signature = hmac.digest();

if (signature.toString('hex') !== decoded.signature) {
    throw 'Signature verification failed (calculated: ' + signature.toString('hex') + ', but received: ' + decoded.signature + ')';
}

console.log('Signature verification OK');

console.log('Payload', decoded.payload);
