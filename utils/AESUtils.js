var CryptoJS = require('./libs/aes.js').CryptoJS;  //引用AES源码js
const util = require('./util.js')
class AESUtils {
  static encrypt(payload, aesKey) {
    var key  = util.buf2hex(aesKey);
    var srcs = util.buf2hex(payload);
    console.log("key srcs ", key, srcs);
    key = CryptoJS.enc.Hex.parse(key);
    srcs = CryptoJS.enc.Hex.parse(srcs);
    console.log("Utf8. key srcs ", key, srcs);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    console.log("encrypt: ", encrypted);
    let encryptedHex = encrypted.ciphertext.toString();
    console.log("encrypt: encryptedHex ", encryptedHex);
    return util.hex2buf(encryptedHex);
  }
  static decrypt(payload, aesKey) {
    var key  = util.buf2hex(aesKey);
    var encryptedHexStr = util.buf2hex(payload);
    console.log("decrypt: key encryptedHexStr ", key, encryptedHexStr);
    key = CryptoJS.enc.Hex.parse(key);
    var srcs = CryptoJS.enc.Hex.parse(encryptedHexStr);
    console.log("decrypt: key srcs ", key, srcs);
    srcs = CryptoJS.enc.Base64.stringify(srcs);
    var decrypt = CryptoJS.AES.decrypt(srcs, key, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    console.log("decrypt: decrypt ", decrypt);
    let decryptedHex = decrypt.toString(CryptoJS.enc.Hex);
    console.log("decrypt: hex", decryptedHex);
    return util.hex2buf(decryptedHex);
  }
}
module.exports = AESUtils