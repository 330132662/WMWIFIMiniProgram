const app = getApp()
const util = require('../utils/util.js');
const config = require('./config.js')
const base64 = require('./base64.js')
let RSAUtils = require('./RSAUtils')
let bluetooth = require('../utils/bluetooth');
let MessageEncode = require('./data/MessageEncode.js')
let MessagePacket = require('./data/MessagePacket.js')
let BleWiFiStaParams = require('./model/BleWiFiStaParams.js')
let BleWiFiConfigStaResult = require('./model/BleWiFiConfigStaResult.js')
class BleWiFiClient {
  data = {
    seq: 0,
    recvSeq: 0,
    deviceId: null,
    serviceId: null,
    charcId: null,
    connected: false,
    messageEncode: null,
    rsaKeys: [],
    aesKey: null,
    encrypt: false,
    timer: null,
    sec_intt: 0
  }
  intt = null;
  onConfigStaCallback = null;
  onNegotiateSecretKeyCallback = null;
  onDisconnectedCallback = null;
  onErrorCallback = null;
  onDebugCallback = null;
  setOnError(callback) {
    this.onErrorCallback = callback;
  }
  setOnDebug(callback) {
    this.onDebugCallback = callback;
  }
  setOnDisconnected(callback) {
    this.onDisconnectedCallback = callback;
  }
  
  closeBleConn() {
    var that = this;
    console.log("closeBleConn: ", that);
    that.cancelTimer();
    that.stopInterval();
    bluetooth.closeBLEConnection(that.data.deviceId)
    .then(res => {
      console.log('device ${res.deviceId} is closed');
    })
    .catch(e => {
      console.log(e);
    })
  }
  onError(status) {
    this.closeBleConn();
    if(this.onErrorCallback) {
      this.onErrorCallback(status);
    }
  }
  onDebug(msg) {
    if(this.onDebugCallback) {
      this.onDebugCallback(msg);
    }
  }
  doTimerTask(sec) {
    var that = this;
    console.log("doTimerTask: timer sec ", sec);
    bluetooth.getBluetoothAdapterState()
    .then(res => {
      console.log("获取蓝牙适配器状态", res);
      if(!res.available) {
        that.onError(config.STATUS_BT_POWER_OFF);
      }
      else if(sec < 1) {
        //time out
        that.onError(config.STATUS_TIMEOUT);
      }
    })
    .catch(e => {
      that.onError(config.STATUS_BT_POWER_OFF);
    });
  }
  startTimer(sec) {
    var that = this;
    that.data.timer = setTimeout(function () {
      sec--;
      that.doTimerTask(sec);
      if(sec > 0) {
        that.startTimer(sec);
      }
    }, 1000);
  }
  cancelTimer() {
    var that = this;
    if(that.data.timer) {
      clearTimeout(that.data.timer);
      that.data.timer = null;
    }
  }
  timer() {
    var that = this;
    console.log("timer ", that.data.sec_intt);
    that.data.sec_intt = that.data.sec_intt + 1;
    // that.setData({
    //   sec_intt: that.data.sec_intt + 1
    // })
  }
  startInterval() {
    var that = this;
    //停止（暂停）
    clearInterval(that.intt);
    //时间重置
    that.data.sec_intt = 0;
    // that.setData({
    //   sec_intt: 0
    // })
    that.intt = setInterval(function () { that.timer() }, 1000);
  }
  stopInterval() {
    var that = this;
    clearInterval(that.intt);
  }
  onDisconnected() {
    console.log("onDisconnected");
    this.cancelTimer();
    this.stopInterval();
    if(this.onDisconnectedCallback) {
      this.onDisconnectedCallback();
    }
  }
  connectInternal(deviceId, connectCallback, serviceFoundCallback, retry) {
    var that = this;
    console.log('connect call');
    that.startInterval();
    that.data.connected = false;
    bluetooth.createBLEConnection(deviceId)
    .then(res => {  
      console.log('连接蓝牙:', res.errMsg);
      that.data.connected = true;
      that.data.deviceId = deviceId;
      that.data.encrypt = false;
      if(connectCallback) {
        connectCallback(true, res.errMsg);
      }
      that.startTimer(10);
      return bluetooth.getBLEDeviceServices(deviceId);
    })
    .then(res => {
      console.log('发现蓝牙服务:', res);
      if(!res) {
        return null;
      }
      console.log(app.globalData.uuidServiceWiFi);
      let service_id = "";
      for(let i = 0;i<res.services.length;i++){
        if(res.services[i].uuid.toUpperCase().indexOf(app.globalData.uuidServiceWiFi) != -1){
          service_id = res.services[i].uuid;
          console.log('found service:', service_id);
          that.data.serviceId = service_id;
          // that.setData({
          //   serviceId: service_id
          // });
          return bluetooth.getBLEDeviceCharacteristics(deviceId, service_id);
        }
      }
    })
    .then(res => {
      console.log('发现蓝牙属性:', res);
      if(!res) {
        return null;
      }
      let charc_id = "";
      for (let i = 0; i < res.characteristics.length; i++) {
        let charc = res.characteristics[i];
        console.log('characteristic: ', charc);
        if(charc.uuid.toUpperCase().indexOf(app.globalData.uuidCharacteristicWrite) != -1){
          charc_id = charc.uuid;
          console.log('found characteristic:', charc_id);
          that.data.charcId = charc_id;
          // that.setData({
          //   charcId: charc_id
          // });
          //开启notify：必须设备的特征值支持notify或者indicate才可以成功调用
          if (charc.properties.indicate) {
            console.log('charc indicate is true');
            return bluetooth.notifyBLECharacteristicValueChange(deviceId, that.data.serviceId, charc_id);
          }
        }
      }
    })
    .then(res => {
      console.log('订阅属性notify', res);
      function bleConnectionStateChaged (res) {
        console.log("bleConnectionStateChaged that: ", that);
        console.log("bleConnectionStateChaged res: ", res);
        console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
        if(!res.connected) {
          that.onDisconnected();
        }
        wx.offBLEConnectionStateChange( bleConnectionStateChaged );
      };
      wx.onBLEConnectionStateChange( bleConnectionStateChaged );
      that.cancelTimer();
      if(!res) {
        that.closeBleConn();
        if(serviceFoundCallback) {
          serviceFoundCallback(false, "service found error");
        }
        return null;
      }
      that.data.seq = 0;
      that.data.recvSeq = 0;
      if(serviceFoundCallback) {
        serviceFoundCallback(true, res.errMsg);
      }
      //监听低功耗蓝牙设备的特征值变化
      wx.onBLECharacteristicValueChange(function (res) {
        if(res.characteristicId.toUpperCase().indexOf(app.globalData.uuidCharacteristicWrite) === -1){
          return;
        }
        console.log('特征值变化', util.buf2hex(res.value));
        that.handleCharacteristicData(res.value);
      });
    })
    .catch(e => {  
      console.log(e);  
      that.closeBleConn();
      if(retry > 0 && that.data.sec_intt <= 4)
      {
        retry--;
        console.log("*********** start retry ", retry);
        that.connectInternal(deviceId, connectCallback, serviceFoundCallback, retry);
      }
      else {
        if(this.data.connected) {
          if(serviceFoundCallback) {
            serviceFoundCallback(false, e.errMsg);
          }
        }
        else {
          if(connectCallback) {
            connectCallback(false, e.errMsg);
          }
        }
      }
    })
  }
  connect(deviceId, connectCallback, serviceFoundCallback) {
    var that = this;
    that.onDebug("start connect");
    that.connectInternal(deviceId, connectCallback, serviceFoundCallback, 5);
  }
  handleCharacteristicData(data) {
    var that = this;
    var messagePacket = MessagePacket.parsePacket(data);
    console.log("handleCharacteristicData: messagePacket ", messagePacket);
    if(!messagePacket) {
      that.onError(config.STATUS_INVALID_PARAMS);
      return; 
    }
    if(that.data.recvSeq != messagePacket.getSeq()){
      return;
    }
    that.data.recvSeq++;
    if(messagePacket.getCmd() === config.PACKET_RESP_CMD_ACK) {
      //TODO handleRespAck
      return;
    }
    if(!that.data.messageEncode){
      that.data.messageEncode = new MessageEncode();
    }
    that.data.messageEncode.addMessagePacket(messagePacket);
    if((messagePacket.getFlag() & config.PACKET_FLAG_LAST_PACKET_MASK) === 0) {
      console.log("handleCharacteristicData: recv last packet");
      let result = this.data.messageEncode.decode(that.data.aesKey);
      this.data.messageEncode = null;
      switch(messagePacket.getCmd()) {
        case config.PACKET_RESP_CMD_CONFIG_STA:
          that.cancelTimer();
          if(that.onConfigStaCallback) {
            that.onConfigStaCallback(result);
          }
          break;
        case config.PACKET_RESP_CMD_KEY_EXCHANGE:
          that.data.aesKey = RSAUtils.decryptByRsaPrikey(that.data.rsaKeys, result.getEncryptedKey());
          console.log("aesKey: ", that.data.aesKey);
          if(!that.data.aesKey) {
            that.onError(config.STATUS_NEGOTIATE_SECRET_KEY);
            break;
          }
          that.data.encrypt = true;
          this.cancelTimer();
          if(that.onNegotiateSecretKeyCallback) {
            that.onNegotiateSecretKeyCallback(result);
          }
          break;
      }
    }
  }
  gattWrite(bufferArray, index, callback) {
    var that = this;
    console.log('gattWrite call');
    bluetooth.writeBLECharacteristicValue(that.data.deviceId, that.data.serviceId, that.data.charcId, bufferArray[index])
    .then(res => {  
      console.log('gattWrite:', res.errMsg);
      this.onDebug("gattWrite:" + res.errMsg);
      if(callback) {
        callback(that, bufferArray, index + 1);
      }
    })
    .catch(e => {  
      console.log(e);  
      that.onError(config.STATUS_GATT_WRITE);
    })
  }
  gattWriteCallback(that, bufferArray, index) {
    if(bufferArray.length > index) {
      that.gattWrite(bufferArray, index, that.gattWriteCallback);
    }
  }
  // testConfigSta(){
  //   var params = new BleWiFiStaParams();
  //   params.setSsid("WinnerMicro");
  //   params.setPassword("20131118");
  //   this.configureSta(params);
  // }
  startGattWrite() {
    var arr = this.messageEncode.getMessagePacketList();
    let bufferArray = [];
    console.log("startGattWrite: arr ", arr);
    for(let j = 0; j < arr.length; j++) {
      var seq = this.data.seq;
      this.data.seq = seq + 1;
      console.log("this.data.seq = ", this.data.seq)
      var messagePacket = arr[j];
      messagePacket.buildPacket(seq, false);//TODO no need ack?
      var u8ArrPack = new Uint8Array(messagePacket.getPackageInfo());
      console.log("data: ", u8ArrPack);
      bufferArray = bufferArray.concat(messagePacket.getPackageInfo());
    } 
    if(bufferArray && bufferArray.length > 0) {
      this.gattWrite(bufferArray, 0, this.gattWriteCallback);
    }
  }
  configureSta(params, callback) {
    if(callback) {
      this.onConfigStaCallback = callback;
    }
    if(!this.dataPrepare(params)) {
      this.onError(config.STATUS_INVALID_PARAMS);
      return false;
    }
    this.startGattWrite();
    this.startTimer(50);
    return true;
  }
  dataPrepare(params) {
    var ssid = params.getSsid();
    var bssid = params.getBssid();
    var psw = params.getPassword();
    console.log("dataPrepare call: ", params);
    console.log("dataPrepare call: ", ssid);
    if((!bssid || bssid === "") && (!ssid || ssid === ""))
    {
      return false;
    }
    this.messageEncode = new MessageEncode();
    if(!(!ssid || ssid === "")) {
      if(ssid.length > config.MAX_LENGHT_SSID) {
        return false;
      }
      this.messageEncode.putStringValue(config.PACKET_TLV_TYPE_AP_SSID, ssid);
    }
    if(!(!psw || psw === "")) {
      if(psw.length > config.MAX_LENGHT_PWD) {
        return false;
      }
      this.messageEncode.putStringValue(config.PACKET_TLV_TYPE_AP_PASSWORD, psw);
    }
    if(!(!bssid || bssid === "")) {
      if(bssid.length == config.HEX_LENGTH_BSSID) {
        var re = /:/gi;
        let bssidBuf = util.hex2buf(bssid.replace(re, ''));
        console.log("bssidBuf: ", bssidBuf);
        this.messageEncode.putBytesValue(config.PACKET_TLV_TYPE_AP_BSSID, bssidBuf);
      }
    }
    this.messageEncode.encode(config.PACKET_CMD_CONFIG_STA, this.data.encrypt, this.data.aesKey);
    return true;
  }
  negotiateSecretKey(callback) {
    var that = this;
    if(callback) {
      that.onNegotiateSecretKeyCallback = callback;
    }
    that.onDebug("negotiateSecretKey");
    let keys = RSAUtils.initKey();
    that.onDebug("initKey over");
    console.log("negotiateSecretKey: keys ", keys);
    that.data.rsaKeys = keys;
    that.messageEncode = new MessageEncode();
    let pubkeyBase64 = RSAUtils.getPublicKey(keys);
    that.onDebug("getPublicKey over");
    let pubkeyBuffer = base64.decode(pubkeyBase64);
    that.onDebug("base64 over");
    console.log("negotiateSecretKey: pubkeyBuffer ", pubkeyBuffer);
    that.messageEncode.putBytesValue(config.PACKET_TLV_TYPE_PUB_KEY, pubkeyBuffer);
    that.messageEncode.encode(config.PACKET_CMD_KEY_EXCHANGE, false, null);
    that.onDebug("start gatt write");
    that.startGattWrite();
    that.startTimer(10);
    return true;
  }
}
module.exports = BleWiFiClient