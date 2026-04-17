// pages/config/config.js
const app = getApp()
const util = require('../../utils/util.js');
let MessagePacket = require('../../utils/data/MessagePacket.js');
let BleWiFiClient = require('../../utils/BleWiFiClient.js');
let BleWiFiStaParams = require('../../utils/model/BleWiFiStaParams.js');
let LogModel = require('../../utils/model/LogModel.js')
const configg = require('../../utils/config.js')
let WiFiUtils = require('../../utils/WiFiUtils.js')
var bleWifiClient = new BleWiFiClient();

var _animation; // 动画实体
var _animationIndex = 0; // 动画执行次数index（当前执行了多少次）
var _animationIntervalId = -1; // 动画定时任务id，通过setInterval来达到无限旋转，记录id，用于结束定时任务
const _ANIMATION_TIME = 1000; // 动画播放一次的时长ms

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '网络设置',
    hint: '仅支持2.4G WiFi网络',
    wifissid: null,
    wifissid_visibility: 'visible',
    wifiBssid: null,
    password: null,
    password_visibility: 'visible',
    wifiFrequency: 0,
    deviceId: null,
    serviceId: null,
    charcId: null,
    list: [],
    scroll_height: 0,
    animation: '',
    scrollTop: 0,
    isShowWifiList: false,
    wifi_list: [{SSID:'dfsd'},{SSID:'dfsd'}],
    isShowPwd: false,
    typePwd: 'password',
    isPwdFocus: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.getSystemInfo({
      complete: (res) => {
        that.setData({
          scroll_height: res.windowHeight
        });
      },
    })
    console.log(options.deviceId);
    that.setData({
      deviceId: options.deviceId
    });
    that.getWIFIName();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    _animationIndex = 0;
    _animationIntervalId = -1;
    this.data.animation = ''; 
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    _animation = wx.createAnimation({
      duration: _ANIMATION_TIME,
      timingFunction: 'linear', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
      delay: 0,
      transformOrigin: '50% 50% 0'
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('onHide: call');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('onUnload: call');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  showPassword: function() {
    if (this.data.isShowPwd) {
      this.setData({
        typePwd:"password",
        isShowPwd:false,
        isPwdFocus: true
      })
    } else {
      this.setData({
        typePwd: "text",
        isShowPwd: true,
        isPwdFocus: true
      })
    }
  },
  /**
   * 实现image旋转动画，每次旋转 120*n度
   */
  rotateAni: function (n) {
    console.log("rotate==", n);
    _animation.rotate(180 * (n)).step()
    this.setData({
      animation: _animation.export()
    })
  },

  /**
   * 开始旋转
   */
  startAnimationInterval: function () {
    var that = this;
    that.rotateAni(++_animationIndex); // 进行一次旋转
    _animationIntervalId = setInterval(function () {
      that.rotateAni(++_animationIndex);
    },  _ANIMATION_TIME); // 每间隔_ANIMATION_TIME进行一次旋转
    console.log('startAnimationInterval: ', _animationIntervalId);
  },

  /**
   * 停止旋转
   */
  stopAnimationInterval: function () {
    if (_animationIntervalId> 0) {
      clearInterval(_animationIntervalId);
      console.log('stopAnimationInterval: ', _animationIntervalId);
      _animationIntervalId = 0;
    }
  },
  getSsidInput:function(e){
    console.log("getSsidInput wifissid: ", this.data.wifissid);
    console.log("getSsidInput: ", e);
    if(e.detail.value != this.data.wifissid) {
      this.setData({
        wifiBssid: null
      });
    }
    this.setData({
      wifissid: e.detail.value
    });
  },
  getPasswordInput:function(e){
    this.setData({
      password: e.detail.value
    })
  },
  onBleConnect: function(result, msg) {
    console.log("蓝牙连接： ", result ? "success" : msg)
    if(result) {
      this.showMessage(0, '连接设备成功');
      this.showMessage(2, '发现服务中...');
    }
    else {
      this.showMessage(1, '连接设备失败');
    }
  },
  onBleServiceFound: function(result, msg) {
    var that = this;
    console.log("蓝牙发现服务： ", result ? "success" : msg)
    if(result) {
      this.showMessage(0, '发现服务成功');
      this.showMessage(2, '密钥交换中...');
      bleWifiClient.negotiateSecretKey(that.onNegotiateSecretKeyCallback);
    }
    else{
      this.showMessage(1, '发现服务失败');
    }
  },
  onNegotiateSecretKeyCallback: function(result) {
    var that = this;
    console.log("onConfigStaCallback: ", result);
    if(result.getStatus() === 0) {
      this.showMessage(0, '秘钥交换成功');
      var params = new BleWiFiStaParams();
      params.setBssid(that.data.wifiBssid);
      params.setSsid(that.data.wifissid);
      params.setPassword(that.data.password);
      this.showMessage(2, '配置设备中...');
      bleWifiClient.configureSta(params, that.onConfigStaCallback);
    }
    else {
      this.showMessage(1, '秘钥交换失败，' + this.getMessage(result.getStatus()));
    }
  },
  onConfigStaCallback: function(result) {
    console.log("onConfigStaCallback: ", result);
    if(result.getStatus() === 0) {
      this.showMessage(0, '配置设备成功');
      this.showMessage(0, 'Mac: ' + result.getMac());
      this.showMessage(0, 'IP Address: ' + result.getIpAddress());
    }
    else {
      this.showMessage(1, '配置设备失败，' + this.getMessage(result.getStatus()));
    }
  },
  OnDisconnected: function() {
    console.log('OnDisconnected call');
    //this.showMessage(1, '设备连接已断开');
  },
  getMessage: function(errCode) {
    let errMsg = '';
    switch (errCode){
      case configg.STATUS_INVALID_PARAMS:
          errMsg = "参数错误";
          break;
      case configg.STATUS_PASSWORD:
          errMsg = "密码错误";
          break;
      case configg.STATUS_DHCP_IP:
          errMsg = "获取IP地址失败";
          break;
      case configg.STATUS_WIFI_SCAN:
          errMsg = "扫描失败";
          break;
      case configg.STATUS_NEGOTIATE_SECerrMsg_KEY:
          errMsg = "秘钥交换失败";
          break;
      case configg.STATUS_GATT_WRITE:
          errMsg = "发送数据失败";
          break;
      case configg.STATUS_TIMEOUT:
          errMsg = "超时";
          break;
      case configg.STATUS_BT_POWER_OFF:
          errMsg = "蓝牙未打开";
          break;
      case configg.STATUS_LOCATION_DISABLE:
          errMsg = "定位未打开";
          break;
    }
    return errMsg;
  },
  OnError: function(errCode) {
    this.showMessage(1, '配置设备失败，' + this.getMessage(errCode));
  },
  OnDebug: function(msg) {
    this.showMessage(1, msg);
  },
  configBtnClick: function (e) {
    var that = this;
    console.log('configBtnClick call');
    this.showMessage(2, '连接设备中...');
    bleWifiClient.setOnDisconnected(that.OnDisconnected);
    bleWifiClient.setOnError(that.OnError);
    //bleWifiClient.setOnDebug(that.OnDebug);
    bleWifiClient.connect(that.data.deviceId, that.onBleConnect, that.onBleServiceFound);
  },
  refresh: function(e) {
    var that = this;
    console.log("refresh: ", e);
    that.getWifiList();
  },
  cancelToast: function (e) {
    this.setData({ 
      wifissid_visibility: "visible",
      password_visibility: "visible",
      isShowWifiList: false,
    });
  },
  radioChange: function (e) {
    console.log("radioChange: e.detail", e.detail);
    console.log("radioChange: e.detail.value", e.detail.value);
    let dval = JSON.parse(e.detail.value);
    console.log("radioChange: ", dval);
    this.setData({ 
      wifissid_visibility: "visible",
      password_visibility: "visible",
      wifissid: dval.ssid,
      wifiBssid: dval.bssid,
      wifiFrequency: dval.frequency,
      isShowWifiList: false,
    });
    if(!this.data.wifiFrequency || this.data.wifiFrequency === "" || this.data.wifiFrequency > 5000) {
      this.setData({
        wifiBssid: null
      });
    }
    console.log("wifiBssid ", this.data.wifiBssid);
  },  
  getWIFIName: function() {
    var that = this;
    console.log('getWIFIName call');
    WiFiUtils.startWifi()
    .then(res => {
      console.log(res);
      return WiFiUtils.getConnectedWifi();
    })
    .then(e => {
      console.log("getConnectedWifi: ", e);
      that.setData({
        wifissid: e.wifi.SSID,
        wifiBssid: e.wifi.BSSID
      });
      if(e.wifi.frequency)
      {
        that.setData({
          wifiFrequency: e.wifi.frequency
        });
      }
      else {
        that.setData({
          wifiFrequency: 0
        });
      }
      if(!e.wifi.frequency || this.data.wifiFrequency > 5000) {
        this.setData({
          wifiBssid: null
        });
      }
      console.log("wifiBssid ", that.data.wifiBssid);
    })
    .catch(e => {
      if(e.errCode === 12006) {
        wx.showToast({
          title: '未打开定位！',
          icon: 'none',
        });
      }
      console.log(e);
    });
  },
  getWifiList: function() {
    var that = this;
    WiFiUtils.startWifi()
    .then(res => {
      console.log("getWifiList: startWifi", res);
      return WiFiUtils.getWifiList();
    })
    .then((res) => {
      console.log("getWifiList: ", res);
      wx.onGetWifiList((result) => {
        console.log("onGetWifiList: ", result);
        that.setData({
          wifissid_visibility: "hidden",
          password_visibility: "hidden",
          wifi_list: result.wifiList,
          isShowWifiList: true,
        });
        console.log("wifi_list ", that.data.wifi_list);
      });
    })
    .catch(e => {
      console.log("getWifiList: ", e);
    });
  },
  showMessage: function(state, msg) {
    var that = this;
    console.log("showMessage: ", state, msg);
    if(state != 2) { //not doing
      let last = that.data.list.pop();
      if(last.state != 2) {
        that.data.list.push(last);
      }
      else{
        that.stopAnimationInterval();
      }
    }
    let log = new LogModel();
    log.setLog(msg);
    log.setState(state);
    that.setData({
      list: that.data.list.concat(log)
    });
    if(state === 2) {
      that.startAnimationInterval();
    }
    that.setData({
      scrollTop: that.data.list.length * 200
    });
  },
})