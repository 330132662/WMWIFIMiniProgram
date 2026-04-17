let MessagePacket = require('./MessagePacket.js');
let BleWiFiConfigStaResult = require('../model/BleWiFiConfigStaResult.js');
let BleWiFiNegotiateSecretKeyResult = require('../model/BleWiFiNegotiateSecretKeyResult.js');
const config = require('../../utils/config.js')
const util = require('../../utils/util.js');
let AESUtils = require('../../utils/AESUtils.js')
class MessageEncode {
  mObjects = new Map();
  mPacketList = [];
  serialize800(encrypt, aesKey) { //boolean, ArrayBuffer
    console.log("serialize800: mObjects ", this.mObjects);
    console.log("serialize800: encrypt ", encrypt, aesKey);
    if(this.mObjects.size === 0) {
      return;
    }
    let totalLength = 0;
    this.mObjects.forEach(function(value, key, map){
      totalLength += 2;
      totalLength += value.byteLength;
    });
    console.log("serialize800: total len is ", totalLength);
    var arr = new Uint8Array(totalLength);
    let offset = 0;
    this.mObjects.forEach(function(value, key, map){
      arr[offset++] = key;
      arr[offset++] = value.byteLength;
      var arrVal = new Uint8Array(value);
      arr.set(arrVal, offset);
      offset += value.byteLength;
    });
    if(encrypt)
    {
      this.totalBytes = new Uint8Array(AESUtils.encrypt(arr.buffer, aesKey));
    }
    else {
      this.totalBytes = arr;
    }
    console.log("serialize800: totalBytes ", this.totalBytes);
  }
  encode(cmd, encrypt, aesKey) {
    this.serialize800(encrypt, aesKey);
    let totalLength = this.totalBytes.length;
    let offset = 0;
    let no = 0;
    while(totalLength > 0) {
      let l = totalLength;
      if(l > 14) {
        l = 14
      }
      var packet = new MessagePacket();
      packet.setCmd(cmd);
      packet.setSeq(0);
      if(l < totalLength) {
        packet.setFlag(config.PACKET_FLAG_LAST_PACKET_MASK);
      }
      else {
        packet.setFlag(0);
      }
      if(encrypt) {
        packet.setFlag(packet.flag | config.PACKET_FLAG_ENCRYPT_MASK);
      }
      packet.setNo(no++);
      var payload = this.totalBytes.buffer.slice(offset, offset + l);
      packet.setPayload(payload);
      console.log("encode: packet ", packet);
      this.mPacketList = this.mPacketList.concat(packet);
      offset += l;
      totalLength -= l;
    }
  }
  decode(aesKey) {
    if(!this.mPacketList || this.mPacketList.length === 0) {
      return null;
    }
    let flag = 0;
    let totalLength = 0;
    let cmd = 0;
    this.mPacketList.forEach(pack => {
      cmd = pack.getCmd();
      flag = pack.getFlag();
      totalLength += pack.getPayload().byteLength;
    });
    let offset = 0;
    var mData = new Uint8Array(totalLength);
    this.mPacketList.forEach(pack => {
      let arr = new Uint8Array(pack.getPayload());
      mData.set(arr, offset);
      offset += arr.length;
    });
    if(flag & config.PACKET_FLAG_ENCRYPT_MASK) {
      mData = new Uint8Array(AESUtils.decrypt(mData.buffer, aesKey));
    }
    offset = 0;
    while(offset < mData.length) {
      let type = mData[offset++];
      let len = mData[offset++];
      if(mData.length >= offset + len) {
        let arr = mData.slice(offset, offset + len);
        console.log("decode: putBytesValue ", type, arr);
        this.putBytesValue(type, arr.buffer);
        offset += len;
      }
      else {
        return null;
      }
    }
    var result = null;
    console.log("decode: dict ", this.mObjects);
    switch(cmd) {
      case config.PACKET_RESP_CMD_CONFIG_STA:
        result = new BleWiFiConfigStaResult(this.mObjects);
        break;
      case config.PACKET_RESP_CMD_KEY_EXCHANGE:
        result = new BleWiFiNegotiateSecretKeyResult(this.mObjects);
        break;
    }
    console.log("decode: result ", result);
    return result;
  }
  putBytesValue(type, buffer) {
    this.mObjects.set(type, buffer);
  }
  putStringValue(type, str) {
    console.log("putStringValue: ", str);
    let arr = util.strToUtf8Buffer(str);
    console.log("putStringValue: ", arr);
    this.putBytesValue(type, arr);
  }
  getMessagePacketList() {
    return this.mPacketList;
  }
  addMessagePacket(packet) {
    this.mPacketList = this.mPacketList.concat(packet);
  }
}
module.exports = MessageEncode