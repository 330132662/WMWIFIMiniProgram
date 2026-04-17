const util = require('../../utils/util.js');
const config = require('../../utils/config.js')
class MessagePacket {
  constructor(cmd) {
    this.cmd = cmd;
  }
  setCmd(cmd) {
    this.cmd = cmd;
  }
  getCmd() {
    return this.cmd;
  }
  setSeq(seq) {
    this.seq = seq;
  }
  getSeq() {
    return this.seq;
  }
  setPayload(payload) {
    this.payload = payload;
  }
  getPayload() {
    return this.payload;
  }
  setFlag(flag) {
    this.flag = flag;
  }
  getFlag() {
    return this.flag;
  }
  setNo(no) {
    this.no = no;
  }
  getPackageInfo() {
    return this.packageInfo;
  }
  showCmd() {
    console.log('cmd: ', this.cmd);
  }
  buildPacket(seq, ack) {
    var arrPayload = new Uint8Array(this.payload);
    this.packageInfo = new ArrayBuffer(arrPayload.length + 5);
    var arrPacketInfo = new Uint8Array(this.packageInfo);
    arrPacketInfo[0] = this.cmd;
    arrPacketInfo[1] = seq & 0xFF;
    if(ack){
        this.flag |= config.PACKET_FLAG_ACK_MASK;
    }
    arrPacketInfo[2] = this.flag;
    arrPacketInfo[3] = this.no;
    arrPacketInfo.set(arrPayload, 4);
    arrPacketInfo[arrPayload.length + 4] = util.calCRC8(this.packageInfo, 0, this.packageInfo.byteLength - 1, 0);
  }
  static parsePacket(buffer) {
    console.log("parsePacket: buffer ", buffer);
    console.log("parsePacket: buffer len ", buffer.byteLength);
    if(!buffer || buffer.byteLength <= 5) {
      return null;
    }
    var u8Arr = new Uint8Array(buffer);
    let messagePacket = null;
    console.log("parsePacket: calCRC8 ", util.calCRC8(buffer, 0, buffer.byteLength - 1, 0));
    console.log("parsePacket: CRC8 ", u8Arr[buffer.byteLength - 1]);
    if(util.calCRC8(buffer, 0, buffer.byteLength - 1, 0) === u8Arr[buffer.byteLength - 1]) {
      messagePacket = new MessagePacket();
      messagePacket.setCmd(u8Arr[0]);
      messagePacket.setSeq(u8Arr[1]);
      messagePacket.setFlag(u8Arr[2]);
      messagePacket.setNo(u8Arr[3]);
      let payload = u8Arr.slice(4, u8Arr.length-1);
      console.log("parsePacket: payload ", payload);
      messagePacket.setPayload(payload.buffer);
    }
    return messagePacket;
  }
}
module.exports = MessagePacket