var Encrypt = require('./libs/jsencrypt.js')
const util = require('./util.js')
const base64 = require('./base64.js')
class RSAUtils {
  static initKey() {
    console.log("initKey: call");
    var crypt = new Encrypt.JSEncrypt({ default_key_size: 1024 });
    crypt.getKey();
    var publicKey = crypt.getPublicKey();
    var privateKey = crypt.getPrivateKey();
    console.log("initKey: publicKey ", publicKey);
    // 返回生成的秘钥对
    return [publicKey, privateKey];
  };
  static getPublicKey(rsaKeys) {
    let publicKey = rsaKeys[0];
    let privateKey = rsaKeys[1];
    // 去除-----*** RSA **** KEY----- 和空格换行
    publicKey = (publicKey.split('-----'))[2];
    publicKey = publicKey.replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "").replace(/\s*/g, "");
    privateKey = (privateKey.split('-----'))[2];
    privateKey = privateKey.replace(/\n/g, "").replace(/\r/g, "").replace(/\t/g, "").replace(/\s*/g, "");

    console.log("initKey: ret publicKey ", publicKey);
    // 返回公钥的base64
    return publicKey;
  }
  static decryptByRsaPrikey(rsaKeys, encrypted) {
    let privateKey = rsaKeys[1];
    var decrypt = new Encrypt.JSEncrypt();
    decrypt.setPrivateKey(privateKey);
    let str = util.buf2string(encrypted);
    str = base64.encode(str);
    var uncrypted = decrypt.decrypt(str);
    console.log("decryptByRsaPrikey: uncrypted", uncrypted);
    return util.strToUint8(uncrypted).buffer;
  };
}
module.exports = RSAUtils