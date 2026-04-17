# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个**微信小程序**项目，用于通过蓝牙(BLE)配置WiFi设备的网络设置。项目使用微信小程序原生框架，实现了一套完整的蓝牙通信协议和安全机制。

## 开发环境

### 前置要求
- 微信开发者工具
- 微信小程序基础库版本 >= 2.17.0
- Android 微信版本 >= 6.5.7 或 iOS 微信版本 >= 6.5.6

### 开发流程
1. 使用微信开发者工具打开项目目录
2. 项目会自动编译（无需额外构建命令）
3. 部分蓝牙API需要真机调试，不支持模拟器

### 项目配置
- **appid**: wx00c42fa6c52942ee (定义在 project.config.json)
- **ES6**: 已启用
- **缩进**: 使用2个空格

## 核心架构

### 蓝牙通信架构

项目采用三层架构设计：

1. **蓝牙适配层** (`utils/bluetooth.js`)
   - 封装所有微信蓝牙API为Promise接口
   - 提供统一的异步调用方式

2. **协议层** (`utils/BleWiFiClient.js`)
   - 实现完整的蓝牙WiFi配置协议
   - 处理连接、断线、重连逻辑
   - 管理加密密钥和加密状态

3. **数据层** (`utils/data/`)
   - `MessagePacket.js`: 数据包封装/解析
   - `MessageEncode.js`: 数据编码/解码，支持分包传输

### 通信协议

#### 数据包格式 (MessagePacket)
```
| CMD(1) | SEQ(1) | FLAG(1) | NO(1) | PAYLOAD(N) | CRC8(1) |
```

- **CMD**: 命令类型（定义在 config.js）
  - `0x0A`: 配置STA模式
  - `0x0F`: 密钥交换
  - `0x8A/0x8F`: 响应命令（最高位置1）
- **SEQ**: 序列号，用于数据包排序
- **FLAG**: 标志位
  - `0x80`: 加密标志
  - `0x40`: ACK标志
  - `0x20`: 最后一包标志
- **NO**: 包序号（用于分包传输）

#### TLV编码格式 (MessageEncode)
```
| TYPE(1) | LENGTH(1) | VALUE(N) | ...
```

### 安全机制

1. **密钥协商**: 使用RSA加密交换AES密钥
2. **数据加密**: 使用AES-ECB模式加密通信数据
3. **数据校验**: 使用CRC8校验数据完整性

### 关键模块

#### BleWiFiClient (核心客户端)
- 状态管理: 连接状态、加密状态、序列号
- 超时管理: 10秒操作超时，自动检测蓝牙状态
- 重试机制: 连接失败最多重试5次
- 回调函数:
  - `onConfigStaCallback`: 配置完成回调
  - `onNegotiateSecretKeyCallback`: 密钥协商回调
  - `onDisconnectedCallback`: 断线回调
  - `onErrorCallback`: 错误回调

#### 蓝牙服务配置 (app.js)
- **Service UUID**: `1824` (uuidServiceWiFi)
- **Characteristic UUID**: `2ABC` (uuidCharacteristicWrite)

## 错误处理

所有错误码定义在 `utils/config.js`:
- `STATUS_SUCCESS`: 0 - 成功
- `STATUS_INVALID_PARAMS`: 1 - 参数无效
- `STATUS_TIMEOUT`: 7 - 超时
- `STATUS_BT_POWER_OFF`: 8 - 蓝牙关闭
- `STATUS_NEGOTIATE_SECRET_KEY`: 5 - 密钥协商失败

## 页面结构

- `pages/root/`: 设备列表页面（首页）
- `pages/config/`: WiFi配置页面
- `pages/settings/`: 设置页面

## 关键约定

1. **所有蓝牙操作都使用Promise封装**
2. **使用async/await处理异步流程**
3. **数据传输采用分包机制，每包最大14字节payload**
4. **加密数据必须先进行密钥协商**
5. **连接失败会自动重试，最多5次**

## 调试技巧

1. 使用console.log查看数据包内容
2. 使用 `onDebugCallback` 获取调试信息
3. 查看特征值变化: `util.buf2hex(res.value)` 十六进制显示
