<template>
  <view class="container">
    <view class="user-header">
      <view class="user-info" @click="goEditProfile">
        <image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"></image>
        <view class="info-detail">
          <text class="username">{{ userInfo.nickname || userInfo.username || '未登录' }}</text>
          <text class="user-id">ID: {{ userInfo._id ? userInfo._id.slice(-6) : '------' }}</text>
        </view>
        <uni-icons type="arrowright" size="20" color="#999"></uni-icons>
      </view>
      
      <view class="user-stats">
        <view class="stat-item" @click="goMyGoods('onSale')">
          <text class="stat-number">{{ myStats.onSale || 0 }}</text>
          <text class="stat-label">在售</text>
        </view>
        <view class="stat-item" @click="goMyGoods('sold')">
          <text class="stat-number">{{ myStats.sold || 0 }}</text>
          <text class="stat-label">已售</text>
        </view>
        <view class="stat-item" @click="goMyMessages">
          <text class="stat-number">{{ myStats.unread || 0 }}</text>
          <text class="stat-label">消息</text>
        </view>
        <view class="stat-item" @click="goMyFavorites">
          <text class="stat-number">{{ myStats.favorites || 0 }}</text>
          <text class="stat-label">收藏</text>
        </view>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">我的功能</text>
      <view class="function-grid">
        <view class="function-item" @click="goMyGoods('all')">
          <view class="function-icon" style="background-color: #4cd964;">
            <uni-icons type="shop" size="24" color="#fff"></uni-icons>
          </view>
          <text class="function-name">我的发布</text>
        </view>
        
        <view class="function-item" @click="goMyFavorites">
          <view class="function-icon" style="background-color: #ff9500;">
            <uni-icons type="star" size="24" color="#fff"></uni-icons>
          </view>
          <text class="function-name">我的收藏</text>
        </view>
        
        <view class="function-item" @click="goMyMessages">
          <view class="function-icon" style="background-color: #007aff;">
            <uni-icons type="chat" size="24" color="#fff"></uni-icons>
          </view>
          <text class="function-name">我的消息</text>
        </view>
        
        <view class="function-item" @click="goFeedback">
          <view class="function-icon" style="background-color: #34aadc;">
            <uni-icons type="help" size="24" color="#fff"></uni-icons>
          </view>
          <text class="function-name">帮助反馈</text>
        </view>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">系统设置</text>
      <view class="menu-list">
        <view class="menu-item" @click="goEditProfile">
          <uni-icons type="person" size="20" color="#666"></uni-icons>
          <text class="menu-text">编辑资料</text>
          <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
        </view>
        
        <view class="menu-item" @click="goSettings">
          <uni-icons type="gear" size="20" color="#666"></uni-icons>
          <text class="menu-text">系统设置</text>
          <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
        </view>
        
        <view class="menu-item" @click="goAbout">
          <uni-icons type="info" size="20" color="#666"></uni-icons>
          <text class="menu-text">关于我们</text>
          <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </view>
    
    <view class="logout-section" v-if="isLoggedIn">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
    
    <view class="login-section" v-else>
      <button class="login-btn" @click="goLogin">立即登录</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {},
      myStats: {
        onSale: 0,
        sold: 0,
        unread: 0,
        favorites: 0
      },
      isLoggedIn: false
    }
  },
  onShow() {
    this.loadUserInfo()
    this.loadMyStats()
  },
  methods: {
    loadUserInfo() {
      const user = uni.getStorageSync('user')
      if (user) {
        this.userInfo = user
        this.isLoggedIn = true
      } else {
        this.userInfo = {}
        this.isLoggedIn = false
      }
    },
    
    async loadMyStats() {
      if (!this.isLoggedIn) return;
      
      try {
        const db = uniCloud.database();
        const user = uni.getStorageSync('user');
        
        // 1. 获取在售和已售数量
        const goodsRes = await db.collection('goods').where({ userId: user._id }).get();
        const myGoods = goodsRes.result.data;
        
        this.myStats.onSale = myGoods.filter(item => item.status === 'onSale').length;
        this.myStats.sold = myGoods.filter(item => item.status === 'sold').length;

        // 2. 获取收藏数量
        const favRes = await db.collection('favorites').where({ userId: user._id }).count();
        this.myStats.favorites = favRes.result.total;

        // 3. 获取未读消息（这里先设为0，等聊天系统完全打通后再查询消息表）
        this.myStats.unread = 0;

      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },
    
    goEditProfile() {
      if (!this.isLoggedIn) {
        this.goLogin()
        return
      }
      uni.navigateTo({
        url: '/pages/edit-profile/edit-profile'
      })
    },
    
    goMyGoods(status) {
      if (!this.isLoggedIn) {
        this.goLogin();
        return;
      }
      uni.navigateTo({
        url: `/pages/my-goods/my-goods?status=${status}`
      });
    },
    
    // 【修改后的收藏跳转】
    goMyFavorites() {
      if (!this.isLoggedIn) {
        this.goLogin()
        return
      }
      uni.navigateTo({
        url: '/pages/my-fav/my-fav' // 跳转到你刚才新建的页面
      })
    },
    
    goMyMessages() {
      if (!this.isLoggedIn) {
        this.goLogin()
        return
      }
      uni.switchTab({
        url: '/pages/message/message'
      })
    },
    
    goFeedback() {
      uni.navigateTo({
        url: '/pages/feedback/feedback'
      })
    },
    
    goSettings() {
      uni.navigateTo({
        url: '/pages/settings/settings'
      })
    },
    
    goAbout() {
      uni.navigateTo({
        url: '/pages/about/about'
      })
    },
    
    goLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      })
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('user')
            uni.removeStorageSync('token')
            this.userInfo = {}
            this.isLoggedIn = false
            this.myStats = { onSale: 0, sold: 0, unread: 0, favorites: 0 }
            
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* 此处保留你原有的样式代码即可，没有变动 */
.container { background-color: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }
.user-header { background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%); padding: 60rpx 30rpx 40rpx; color: #fff; }
.user-info { display: flex; align-items: center; margin-bottom: 40rpx; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; border: 4rpx solid rgba(255, 255, 255, 0.3); margin-right: 20rpx; }
.info-detail { flex: 1; }
.username { display: block; font-size: 40rpx; font-weight: bold; margin-bottom: 10rpx; }
.user-id { font-size: 26rpx; opacity: 0.9; }
.user-stats { display: flex; justify-content: space-around; padding-top: 30rpx; border-top: 1rpx solid rgba(255, 255, 255, 0.2); }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-number { font-size: 40rpx; font-weight: bold; margin-bottom: 10rpx; }
.stat-label { font-size: 26rpx; opacity: 0.9; }
.section { background-color: #fff; margin: 20rpx 30rpx; padding: 30rpx; border-radius: 20rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05); }
.section-title { display: block; font-size: 32rpx; color: #333; font-weight: bold; margin-bottom: 30rpx; }
.function-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20rpx; }
.function-item { display: flex; flex-direction: column; align-items: center; }
.function-icon { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 15rpx; }
.function-name { font-size: 24rpx; color: #666; }
.menu-list { margin-top: 10rpx; }
.menu-item { display: flex; align-items: center; padding: 30rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.menu-text { flex: 1; font-size: 30rpx; color: #333; margin-left: 20rpx; }
.logout-section, .login-section { margin: 40rpx 30rpx; }
.logout-btn, .login-btn { background-color: #fff; color: #ff6b35; border: 1rpx solid #ff6b35; height: 90rpx; border-radius: 45rpx; font-size: 32rpx; font-weight: bold; display: flex; align-items: center; justify-content: center; }
.logout-btn:after, .login-btn:after { border: none; }
.login-btn { background-color: #ff6b35; color: #fff; border: none; }
</style>