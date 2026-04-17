//index.js
//获取应用实例
const app = getApp()
let AESUtils = require('../../utils/AESUtils.js')
var CryptoJS = require('../../utils/libs/aes.js').CryptoJS;  //引用AES源码js
Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  testAes: function() {
    var keyArr = [0xe3, 0x31, 0x32, 0x33, 0x30, 0x31, 0x32, 0x33, 0x30, 0x31, 0x32, 0x33, 0x30, 0x31, 0x32, 0x33];
    var dataArr = [0x01, 0x0c, 0x54, 0x50, 0x2d, 0x4c, 0x49, 0x4e, 0x4b, 0x5f, 0x38, 0x32, 0x30, 0x30];
    let word = '1234567890'
    let srcs = CryptoJS.enc.Utf8.parse(word);
    console.log("srcs:",  srcs);
    let encrypt = AESUtils.encrypt(dataArr, keyArr);
    console.log("testAes: ", encrypt);
    let decrypt = AESUtils.decrypt(encrypt, keyArr);
    console.log("testAes: decrypt ", decrypt);
  },
  onLoad: function () {
    this.testAes();
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
