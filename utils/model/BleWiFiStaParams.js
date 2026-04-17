
class BleWiFiStaParams {
  setSsid(ssid) {
    this.ssid = ssid;
  }
  getSsid() {
    return this.ssid;
  }
  setPassword(password) {
    this.password = password;
  }
  getPassword() {
    return this.password;
  }
  setBssid(bssid) {
    this.bssid = bssid;
  }
  getBssid() {
    return this.bssid;
  }
}
module.exports = BleWiFiStaParams