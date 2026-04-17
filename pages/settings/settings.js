// pages/settings/settings.js
const config = require('../../utils/config.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '设置',
    orgId: '',
    version: '1.0.4',
    isShowConfirm: false,
    orgIdVal: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let orgId = wx.getStorageSync(config.ORGANIZATION_ID_KEY);
    this.setData({
      orgIdVal: orgId,
      orgId: orgId,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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
  showDialog: function() {
    var that = this
    that.setData({
      isShowConfirm: true,
      orgIdVal: that.data.orgId,
    })
  },
  setValue: function (e) {
    this.setData({
      orgIdVal: e.detail.value
    })
  },
  cancel: function () {
    var that = this;
    that.setData({
      isShowConfirm: false,
      orgIdVal: that.data.orgId,
    });
  },
  confirmAcceptance:function(){
    var that = this;
    that.setData({
      isShowConfirm: false,
      orgId: that.data.orgIdVal.toUpperCase()
    });
    wx.setStorageSync(config.ORGANIZATION_ID_KEY, that.data.orgIdVal.toUpperCase());
  },
})