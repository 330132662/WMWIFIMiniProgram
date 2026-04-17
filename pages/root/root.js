// pages/root/root.js
const app = getApp()
const config = require('../../utils/config.js')
const util = require('../../utils/util.js');
let bluetooth = require('../../utils/bluetooth'); 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '设备列表', 
    list: [], // 数据列表
    type: '', // 数据类型
    loading: true // 显示等待框
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (app.getPlatform() == 'android' && this.versionCompare('6.5.7', app.getVersion())) {
      wx.showModal({
          title: '提示',
          content: '当前微信版本过低，请更新至最新版本',
          showCancel: false
      })
    }
    else if (app.getPlatform() == 'ios' && this.versionCompare('6.5.6', app.getVersion())) {
      wx.showModal({
          title: '提示',
          content: '当前微信版本过低，请更新至最新版本',
          showCancel: false
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success () {
              console.log("用户允许定位权限");
            }
          })
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const that = this;
    wx.startPullDownRefresh({
      complete: (res) => {
        that.setData({
          loading: true
        });
      },
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  versionCompare: function (ver1, ver2) { //版本比较
    var version1pre = parseFloat(ver1)
    var version2pre = parseFloat(ver2)
    var version1next = parseInt(ver1.replace(version1pre + ".", ""))
    var version2next = parseInt(ver2.replace(version2pre + ".", ""))
    if (version1pre > version2pre)
        return true
    else if (version1pre < version2pre) 
        return false
    else {
        if (version1next > version2next)
            return true
        else
            return false
    }
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    console.log("onPullDown");
    bluetooth.getBluetoothAdapterState()
    .then(res => {
      console.log("获取蓝牙适配器状态", res);
      if(!res.available) {
        that.stopBluetoothDevicesDiscovery(1);
        wx.showToast({
          title: '蓝牙未打开!',
          icon: 'none',
        })
        return null;
      }
      else {
        that.setData({
          loading: true,
          list: []
        });
        return bluetooth.closeBluetoothAdapter();
      }
    })
    .then(res => {
      console.log("关闭蓝牙适配器", res);
      if(!res) {
        return null;
      }
      that.startDiscoverDevice();
    })
    .catch(e => {  
      console.log("catch error ", e);  
      that.startDiscoverDevice();
    })
  },
  startDiscoverDevice: function() {
    var that = this;
    bluetooth.openBluetoothAdapter()
    .then(d => {  
      console.log("初始化蓝牙适配器成功", d);
      return bluetooth.getBluetoothAdapterState();
    }) 
    .then(res => {  
      console.log(JSON.stringify(res.errMsg) + "\n蓝牙是否可用：" + res.available);
      return bluetooth.startBluetoothDevicesDiscovery();
    }) 
    .then(res => {  
      that.stopBluetoothDevicesDiscovery(4000);//todo
      that.onBluetoothDeviceFound();
    }) 
    .catch(e => {  
      console.log(e);  
      if(e.errCode === 10001) {
        wx.showToast({
          title: '蓝牙未打开!',
          icon: 'none',
        })
      }
      that.stopBluetoothDevicesDiscovery(1);
    })
  },
  stopBluetoothDevicesDiscovery: function (delay) {
    const that = this;
    setTimeout(function () {
      that.setData({
        loading: false
      });
      wx.stopBluetoothDevicesDiscovery({
        complete: (res) => {
          console.log('结束蓝牙发现设备');
        },
      });
      // wx.closeBluetoothAdapter({
      //   complete: (res) => {
      //     console.log('关闭蓝牙适配器');
      //   },
      // });
      wx.stopPullDownRefresh({
        complete: (res) => {
          console.log('~~~结束下拉刷新～～～');
        },
      });
    }, delay);
  },
  onBluetoothDeviceFound: function () {
    var that = this;
    console.log('在蓝牙设备发现');
    wx.onBluetoothDeviceFound(function (res) { //监听寻找到新设备的事件
      for(let i = 0; i < res.devices.length; i++) {
        let device = res.devices[i];
        if (device && device.advertisData) {
          var name = device.name;  //搜索到的设备名称
          console.log("device ", device);
          let advertisData = device.advertisData;
          let orgIdStr = util.buf2OrgId(advertisData);
          console.log('advertisData ', advertisData, orgIdStr);
          let orgId = wx.getStorageSync(config.ORGANIZATION_ID_KEY);
          if(!orgId || orgId === '' || orgId === orgIdStr) {
            that.setData({
              list: that.data.list.concat(device)
            });
            console.log(that.data.list);
          }
        }
      }
    })
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

  }
})