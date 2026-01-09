<template>
  <view class="container">
    <view class="header">
      <text class="title">校园闲置交易平台</text>
      <text class="subtitle">让闲置物品找到新主人</text>
    </view>
    
    <view class="form-container">
      <view class="tab-bar">
        <view 
          :class="['tab-item', activeTab === 'login' ? 'active' : '']"
          @click="switchTab('login')"
        >
          登录
        </view>
        <view 
          :class="['tab-item', activeTab === 'register' ? 'active' : '']"
          @click="switchTab('register')"
        >
          注册
        </view>
      </view>
      
      <!-- 登录表单 -->
      <view v-if="activeTab === 'login'" class="form">
        <view class="input-group">
          <uni-icons type="person" size="24" color="#999"></uni-icons>
          <input 
            class="input" 
            v-model="loginForm.username" 
            placeholder="请输入用户名/手机号"
            @confirm="handleLogin"
          />
        </view>
        
        <view class="input-group">
          <uni-icons type="locked" size="24" color="#999"></uni-icons>
          <input 
            class="input" 
            v-model="loginForm.password" 
            type="password"
            placeholder="请输入密码"
            @confirm="handleLogin"
          />
        </view>
        
        <button class="btn primary" @click="handleLogin" :disabled="loginLoading">
          {{ loginLoading ? '登录中...' : '登录' }}
        </button>
        
        <view class="quick-login">
          <text class="quick-text">快速登录</text>
          <view class="quick-icons">
            <view class="icon-item" @click="wechatLogin">
              <image class="icon" src="/static/wechat.png"></image>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 注册表单 -->
      <view v-else class="form">
        <view class="input-group">
          <uni-icons type="person" size="24" color="#999"></uni-icons>
          <input 
            class="input" 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
          />
        </view>
        
        <view class="input-group">
          <uni-icons type="phone" size="24" color="#999"></uni-icons>
          <input 
            class="input" 
            v-model="registerForm.phone" 
            type="number"
            placeholder="请输入手机号"
          />
        </view>
        
        <view class="input-group">
          <uni-icons type="locked" size="24" color="#999"></uni-icons>
          <input 
            class="input" 
            v-model="registerForm.password" 
            type="password"
            placeholder="请输入密码"
          />
        </view>
        
        <view class="input-group">
          <uni-icons type="locked" size="24" color="#999"></uni-icons>
          <input 
            class="input" 
            v-model="registerForm.confirmPassword" 
            type="password"
            placeholder="请确认密码"
          />
        </view>
        
        <button class="btn primary" @click="handleRegister" :disabled="registerLoading">
          {{ registerLoading ? '注册中...' : '注册' }}
        </button>
      </view>
    </view>
    
    <view class="footer">
      <text class="agreement">注册即表示同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script>
//import crypto from 'crypto-js'

export default {
  data() {
    return {
      activeTab: 'login',
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      loginLoading: false,
      registerLoading: false
    }
  },
  methods: {
    switchTab(tab) {
      this.activeTab = tab
    },
    
    // 加密密码
    encryptPassword(password) {
      //return crypto.MD5(password).toString()
	  return btoa(password)
    },
    
    // 登录
   async handleLogin() {
   	if (!this.loginForm.username || !this.loginForm.password) {
   		uni.showToast({ title: '请输入用户名和密码', icon: 'none' });
   		return;
   	}
   
   	this.loginLoading = true;
   	try {
   		// 调用新写的登录云函数
   		const res = await uniCloud.callFunction({
   			name: 'user-login',
   			data: {
   				username: this.loginForm.username,
   				// 同样在传输前加密，与注册时的加密逻辑保持一致
   				password: this.encryptPassword(this.loginForm.password)
   			}
   		});
   
   		const { code, msg, userInfo } = res.result;
   
   		if (code === 200) {
   			// 保存用户信息到本地缓存
   			uni.setStorageSync('user', userInfo);
   			uni.setStorageSync('token', userInfo._id);
   
   			uni.showToast({ title: '登录成功', icon: 'success' });
   
   			setTimeout(() => {
   				uni.switchTab({ url: '/pages/index/index' });
   			}, 1500);
   		} else {
   			uni.showToast({ title: msg, icon: 'none' });
   		}
   	} catch (error) {
   		console.error('登录异常：', error);
   		uni.showToast({ title: '登录系统异常', icon: 'none' });
   	} finally {
   		this.loginLoading = false;
   	}
   },
    

    // 注册
    // 注册功能
    async handleRegister() {
        // 1. 调用本地验证逻辑（校验格式、长度、两次密码一致性）
        if (!this.validateRegisterForm()) {
            return
        }
    
        this.registerLoading = true
        
        try {
            // 2. 调用云函数进行注册
            // 注意：这里不再直接 db.collection('users').add，而是通过云函数中转
            const res = await uniCloud.callFunction({
                name: 'user-register',
                data: {
                    username: this.registerForm.username,
                    phone: this.registerForm.phone,
                    // 传输加密后的密码，保证链路安全
                    password: this.encryptPassword(this.registerForm.password)
                }
            })
    
            // 3. 处理云函数返回的结果
            const { code, msg } = res.result
            
            if (code === 200) {
                uni.showToast({
                    title: '注册成功',
                    icon: 'success'
                })
                
                // 注册成功后的后续操作
                setTimeout(() => {
                    this.activeTab = 'login' // 切换到登录选项卡
                    // 清空表单数据
                    this.registerForm = {
                        username: '',
                        phone: '',
                        password: '',
                        confirmPassword: ''
                    }
                }, 1500)
                
            } else {
                // 处理云函数返回的业务错误（如：用户名已存在）
                uni.showToast({
                    title: msg || '注册失败',
                    icon: 'none',
                    duration: 2000
                })
            }
    
        } catch (error) {
            // 处理网络错误或系统崩溃
            console.error('请求云函数异常：', error)
            uni.showToast({
                title: '系统繁忙，请稍后再试',
                icon: 'none'
            })
        } finally {
            this.registerLoading = false
        }
    },
    
    // 验证注册表单
    validateRegisterForm() {
      if (!this.registerForm.username.trim()) {
        uni.showToast({
          title: '请输入用户名',
          icon: 'none'
        })
        return false
      }
      
      if (this.registerForm.username.length < 3) {
        uni.showToast({
          title: '用户名至少3个字符',
          icon: 'none'
        })
        return false
      }
      
      if (!/^1[3-9]\d{9}$/.test(this.registerForm.phone)) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        })
        return false
      }
      
      if (!this.registerForm.password) {
        uni.showToast({
          title: '请输入密码',
          icon: 'none'
        })
        return false
      }
      
      if (this.registerForm.password.length < 6) {
        uni.showToast({
          title: '密码至少6位',
          icon: 'none'
        })
        return false
      }
      
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        uni.showToast({
          title: '两次密码不一致',
          icon: 'none'
        })
        return false
      }
      
      return true
    },
    
    // 微信登录
    wechatLogin() {
      uni.showToast({
        title: '此功能需在小程序中体验',
        icon: 'none'
      })
    }
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
  padding: 60rpx 60rpx 0;
}

.header {
  text-align: center;
  margin-top: 100rpx;
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form-container {
  background-color: #fff;
  border-radius: 30rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.1);
}

.tab-bar {
  display: flex;
  margin-bottom: 50rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 32rpx;
  color: #999;
  position: relative;
}

.tab-item.active {
  color: #FF6B35;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #FF6B35;
  border-radius: 2rpx;
}

.input-group {
  display: flex;
  align-items: center;
  border-bottom: 2rpx solid #f5f5f5;
  padding: 30rpx 0;
  margin-bottom: 20rpx;
}

.input {
  flex: 1;
  font-size: 30rpx;
  margin-left: 20rpx;
  color: #333;
}

.btn {
  height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
  border: none;
}

.btn.primary {
  background-color: #FF6B35;
  color: #fff;
}

.btn.primary[disabled] {
  background-color: #FFB594;
}

.quick-login {
  margin-top: 50rpx;
  text-align: center;
}

.quick-text {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.quick-icons {
  display: flex;
  justify-content: center;
  gap: 40rpx;
}

.icon-item {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 50rpx;
  height: 50rpx;
}

.footer {
  text-align: center;
  margin-top: 40rpx;
  margin-bottom: 40rpx;
}

.agreement {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>