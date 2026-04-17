class BlueTooth {
  static openBluetoothAdapter() {  
    return new Promise((resolve, reject) => 
      wx.openBluetoothAdapter({ success: resolve, fail: reject }));  
  }; 
  static closeBluetoothAdapter() {  
    return new Promise((resolve, reject) => 
      wx.closeBluetoothAdapter({ success: resolve, fail: reject }));  
  }; 
  static getBluetoothAdapterState() {
    return new Promise((resolve, reject) => 
      wx.getBluetoothAdapterState({ success: resolve, fail: reject }));  
  };
  static startBluetoothDevicesDiscovery() {
    return new Promise((resolve, reject) => 
      wx.startBluetoothDevicesDiscovery({ success: resolve, fail: reject }));  
  };
  static createBLEConnection(deviceId) {
    return new Promise((resolve, reject) => 
    wx.createBLEConnection({
      deviceId: deviceId,//搜索设备获得的蓝牙设备 id
      success: resolve,
      fail: reject }));
  };
  static closeBLEConnection(deviceId) {
    return new Promise((resolve, reject) => 
    wx.closeBLEConnection({
      deviceId: deviceId,//搜索设备获得的蓝牙设备 id
      success: resolve,
      fail: reject }));
  };
  static getBLEDeviceServices(deviceId) {
    return new Promise((resolve, reject) => 
    wx.getBLEDeviceServices({
      deviceId: deviceId,//搜索设备获得的蓝牙设备 id
      success: resolve,
      fail: reject }));
  };
  static getBLEDeviceCharacteristics(deviceId, serviceId) {
    return new Promise((resolve, reject) => 
    wx.getBLEDeviceCharacteristics({
      deviceId: deviceId,//搜索设备获得的蓝牙设备 id
      serviceId: serviceId,//服务ID
      success: resolve,
      fail: reject }));
  };
  static notifyBLECharacteristicValueChange(deviceId, serviceId, charcId) {
    return new Promise((resolve, reject) => 
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      deviceId: deviceId,//搜索设备获得的蓝牙设备 id
      serviceId: serviceId,//服务ID
      characteristicId: charcId,//服务特征值indicate
      success: resolve,
      fail: reject }));
  };
  static writeBLECharacteristicValue(deviceId, serviceId, charcId, buffer) {
    return new Promise((resolve, reject) => 
    wx.writeBLECharacteristicValue({
      deviceId: deviceId,//搜索设备获得的蓝牙设备 id
      serviceId: serviceId,//服务ID
      characteristicId: charcId,//服务特征值indicate
      value: buffer,//写入数据
      success: resolve,
      fail: reject }));
  };
}

module.exports = BlueTooth;