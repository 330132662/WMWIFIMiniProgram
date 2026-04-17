let BleWiFiBaseResult = require('./BleWiFiBaseResult.js')
const config = require('../../utils/config.js') 
const util = require('../../utils/util.js');
class BleWiFiConfigStaResult extends BleWiFiBaseResult {
  constructor(dicData) {
    super(dicData);
    if(dicData) {
      let key = config.PACKET_RESP_TLV_TYPE_MAC;
      let val = dicData.get(key);
      if(val) {
        this.mac = util.formatHexString(val, ':');
      }
      key = config.PACKET_RESP_TLV_TYPE_IP_ADDR;
      val = dicData.get(key);
      if(val) {
        this.ipAddress = util.buf2ip(val);
      }
    }
  }
  getMac() {
    return this.mac;
  }
  getIpAddress() {
    return this.ipAddress;
  }
}
module.exports = BleWiFiConfigStaResult