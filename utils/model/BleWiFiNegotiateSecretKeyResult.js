let BleWiFiBaseResult = require('./BleWiFiBaseResult.js')
const config = require('../../utils/config.js') 
const util = require('../../utils/util.js');
class BleWiFiNegotiateSecretKeyResult extends BleWiFiBaseResult {
  constructor(dicData) {
    super(dicData);
    if(dicData) {
      let key = config.PACKET_RESP_TLV_TYPE_PUB_ENC_KEY;
      let val = dicData.get(key);
      if(val) {
        this.encryptedKey = val;
      }
    }
  }
  getEncryptedKey() {
    return this.encryptedKey;
  }
}
module.exports = BleWiFiNegotiateSecretKeyResult