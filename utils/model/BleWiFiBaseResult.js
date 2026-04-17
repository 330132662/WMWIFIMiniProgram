const config = require('../../utils/config.js') 
class BleWiFiBaseResult {
  status = 0;
  constructor(dicData) {
    if(dicData) {
      let key = config.PACKET_RESP_TLV_TYPE_ERROR_ID;
      let val = dicData.get(key);
      if(val) {
        let u8Arr = new Uint8Array(val);
        this.status = u8Arr[0];
      }
    }
  }
  getStatus() {
    return this.status;
  }
}
module.exports = BleWiFiBaseResult