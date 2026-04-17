class WiFiUtils {
  static startWifi() {
    return new Promise((resolve, reject) => 
      wx.startWifi({ success: resolve, fail: reject }));  
  };
  static stopWifi() {
    return new Promise((resolve, reject) => 
      wx.stopWifi({ success: resolve, fail: reject }));  
  };
  static getConnectedWifi() {
    return new Promise((resolve, reject) => 
      wx.getConnectedWifi({ success: resolve, fail: reject }));  
  };
  static getWifiList() {
    return new Promise((resolve, reject) => 
      wx.getWifiList({ success: resolve, fail: reject }));  
  };
}
module.exports = WiFiUtils