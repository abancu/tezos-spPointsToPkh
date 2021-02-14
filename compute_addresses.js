const {Buffer} = require("buffer");
const request = require('request');


const { TezosToolkit } = require('@taquito/taquito');
const toolkit = new TezosToolkit('https://mainnet-tezos.giganode.io');
const elliptic = require('elliptic');
const Bs58check = require('bs58check');
const libs = require('libsodium-wrappers');

const lineReader = require('line-reader');
const fs = require('fs');

let prefix = {
    tz1: new Uint8Array([6, 161, 159]),
    tz2: new Uint8Array([6, 161, 161]),
    tz3: new Uint8Array([6, 161, 164]),
    edpk: new Uint8Array([13, 15, 37, 217]),
    sppk: new Uint8Array([3, 254, 226, 86]),
    edsk: new Uint8Array([43, 246, 78, 7]),
    spsk: new Uint8Array([17, 162, 224, 201]),
    edsig: new Uint8Array([9, 245, 205, 134, 18]),
    spsig: new Uint8Array([13, 115, 101, 19, 63]),
    sig: new Uint8Array([4, 130, 43]),
    o: new Uint8Array([5, 116]),
    B: new Uint8Array([1, 52]),
    TZ: new Uint8Array([3, 99, 29]),
    KT: new Uint8Array([2, 90, 121])
};

const fromAddress = 'tz1gHJt7J1aEtW2wpCR5RJd3CpnbVxUTaEXS';

(async() => {
    await libs.ready;
    fs.writeFile('./data.csv', '', function(err) {
        if (err) console.log(err);
        lineReader.eachLine('./twitter_ids', function(line) {
            let options = {
                url: "https://torus-19.torusnode.com/jrpc",
                method: "get",
                timeout: 1000,
                headers:
                    {
                        "content-type": "application/json"
                    },
                body: JSON.stringify(
                    {
                        "id": 10,
                        "jsonrpc": "2.0",
                        "method": "VerifierLookupRequest",
                        "params": {
                            "verifier": "tezos-twitter",
                            "verifier_id": `twitter|${line}`
                        }

                    }
                )
            };
            request(options, (error, response, body) => {
                if (error) {
                    console.error('An error has occurred: ', error);
                } else {
                    try {
                        body = JSON.parse(body);
                        if (!body.error) {
                            let tz2 = spPointsToPkh(body.result.keys[0].pub_key_X, body.result.keys[0].pub_key_Y);
                            toolkit.tz.getBalance(tz2).then( x => {
                                fs.appendFile('./data.csv', `${fromAddress},${tz2},0,1\n`, function (err) {
                                    if (err) throw err;
                                    console.log('Saved!');
                                });
                            }).catch(e => console.log(e));
                        }
                    } catch (e) {
                        console.log(e, options, body);
                    }
                }
            });
        });
    });


    // console.log(spPointsToPkh(px, py));
})();
function spPointsToPkh(pubX, pubY) {
    const key = (new elliptic.ec('secp256k1')).keyFromPublic({ x: pubX, y: pubY });
    const prefixVal = key.getPublic().getY().toArray()[31] % 2 ? 3 : 2;
    const pad = new Array(32).fill(0);
    const publicKey = new Uint8Array(
        [prefixVal].concat(pad.concat(key.getPublic().getX().toArray()).slice(-32)
        ));
    const pk = b58cencode(publicKey, prefix.sppk);
    const pkh = pk2pkh(pk);
    return pkh;
}


function b58cencode(payload, prefixx) {
    const n = new Uint8Array(prefixx.length + payload.length);
    n.set(prefixx);
    n.set(payload, prefixx.length);
    return Bs58check.encode(Buffer.from(buf2hex(n), 'hex'));
}

function pk2pkh(pk) {
    if (pk.length === 54 && pk.slice(0, 4) === 'edpk') {
        const pkDecoded = b58cdecode(pk, prefix.edpk);
        return b58cencode(libs.crypto_generichash(20, pkDecoded), prefix.tz1);
    } else if (pk.length === 55 && pk.slice(0, 4) === 'sppk') {
        const pkDecoded = b58cdecode(pk, prefix.edpk);
        return b58cencode(libs.crypto_generichash(20, pkDecoded), prefix.tz2);
    }
    throw new Error('Invalid public key');
}


function buf2hex(buffer) {
    const byteArray = new Uint8Array(buffer), hexParts = [];
    for (let i = 0; i < byteArray.length; i++) {
        const hex = byteArray[i].toString(16);
        const paddedHex = ('00' + hex).slice(-2);
        hexParts.push(paddedHex);
    }
    return hexParts.join('');
}

function b58cdecode(enc, prefixx) {
    let n = Bs58check.decode(enc);
    n = n.slice(prefixx.length);
    return n;
}







