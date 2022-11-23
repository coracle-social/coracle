import {Buffer} from "buffer"
import * as secp from "@noble/secp256k1"

const toHex = buffer => Buffer.from(buffer).toString("hex")

export default {
  generatePrivateKey: () => toHex(secp.utils.randomPrivateKey()),
  getPublicKey: privKey => toHex(secp.schnorr.getPublicKey(privKey)),
  sign: async (hex, privKey) => toHex(await secp.schnorr.sign(hex, privKey)),
  verify: (sig, payload, pubKey) => secp.schnorr.verify(sig, payload, pubKey),
}
