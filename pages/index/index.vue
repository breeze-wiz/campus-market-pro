<template>
  <view class="container">
    <view class="header">
      <view class="search-bar">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input 
          class="search-input" 
          v-model="keyword" 
          placeholder="搜索商品名称或描述" 
          confirm-type="search"
          @confirm="handleSearch"
        />
        <view class="close-icon" v-if="keyword" @click="clearSearch">
          <uni-icons type="clear" size="18" color="#ccc"></uni-icons>
        </view>
      </view>
      <view class="search-btn" @click="handleSearch">搜索</view>
    </view>
    
    <view class="header-placeholder"></view>
    
    <scroll-view class="category-scroll" scroll-x>
      <view class="category-list">
        <view 
          v-for="(item, index) in categories" 
          :key="item.id"
          :class="['category-item', activeCategory === item.id ? 'active' : '']"
          @click="changeCategory(item.id)"
        >
          {{ item.name }}
        </view>
      </view>
    </scroll-view>
    
    <view class="goods-list">
      <view v-if="goodsList.length === 0 && !loading" class="empty-state">
        <text>没有找到相关商品</text>
      </view>

      <view 
        v-for="item in goodsList" 
        :key="item._id"
        class="goods-item"
        @click="goDetail(item._id)"
      >
        <image 
          class="goods-img" 
          :src="item.images && item.images.length > 0 ? item.images[0] : '/static/default-image.png'" 
          mode="aspectFill"
        ></image>
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <view class="goods-price">
            <text class="price">¥{{ item.price }}</text>
            <text class="original-price" v-if="item.originalPrice">¥{{ item.originalPrice }}</text>
          </view>
          <view class="goods-meta">
            <text class="location" v-if="item.location">{{ item.location }}</text>
            <text class="time">{{ formatTime(item.createTime) }}</text>
          </view>
          <view class="user-info">
            <image class="avatar" :src="item.userAvatar || '/static/default-avatar.png'"></image>
            <text class="username">{{ item.userName }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="load-more" v-if="goodsList.length > 0">
      <text>{{ loading ? '加载中...' : (hasMore ? '上拉加载更多' : '没有更多了') }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      keyword: '', // 新增：搜索关键词
      categories: [
        { id: 'all', name: '全部' },
        { id: 'book', name: '图书教材' },
        { id: 'digital', name: '数码产品' },
        { id: 'daily', name: '生活用品' },
        { id: 'clothes', name: '服饰鞋包' },
        { id: 'other', name: '其他' }
      ],
      activeCategory: 'all',
      goodsList: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false
    }
  },
  onLoad() {
    this.loadGoodsList()
  },
  onShow() {
    // 这里的逻辑保留，但要注意：如果你是在搜索状态下切出去再回来，
    // 可能希望保留搜索结果，或者重置。这里默认重置回全部
    // 如果想保留搜索状态，可以把下面的重置逻辑加个判断
    /* this.page = 1;
    this.goodsList = [];
    this.hasMore = true;
    this.loadGoodsList(); 
    */
  },
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.page++
      this.loadGoodsList()
    }
  },
  onPullDownRefresh() {
    this.reloadList()
    setTimeout(() => {
      uni.stopPullDownRefresh()
    }, 1000)
  },
  methods: {
    // 重新加载列表的通用方法
    reloadList() {
      this.page = 1
      this.goodsList = []
      this.hasMore = true
      this.loadGoodsList()
    },

    // 处理搜索
    handleSearch() {
      // 搜索时重置分类为“全部”可能体验更好，或者在当前分类下搜，看你需求。这里暂不重置分类
      this.reloadList()
    },

    // 清空搜索
    clearSearch() {
      this.keyword = ''
      this.reloadList()
    },

    async loadGoodsList() {
      this.loading = true;
      try {
        const result = await uniCloud.callFunction({
          name: 'get-goods-list',
          data: {
            // 核心修改：把 keyword 传给云函数
            keyword: this.keyword, 
            category: this.activeCategory === 'all' ? null : this.activeCategory,
            page: this.page,
            pageSize: this.pageSize
          }
        });
        
        if (result.result.code === 200) {
          const newGoods = result.result.data;
          
          if (newGoods.length > 0) {
            this.goodsList = [...this.goodsList, ...newGoods];
          }
          // 判断是否还有更多：如果返回的数量小于分页数量，说明没了
          this.hasMore = newGoods.length === this.pageSize;
        } else {
          console.error('获取商品列表失败:', result.result.msg);
        }
        
      } catch (error) {
        console.error('加载商品失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
      this.loading = false;
    },
    
    changeCategory(categoryId) {
      this.activeCategory = categoryId
      this.reloadList()
    },
    
    goDetail(goodsId) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${goodsId}`
      })
    },
    
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 顶部固定区域 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: #fff;
  padding: 20rpx 30rpx;
  /* 适配 H5 和 App，如果是小程序可能需要处理胶囊位置 */
  /* #ifdef MP-WEIXIN */
  padding-top: 88rpx; 
  /* #endif */
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.header-placeholder {
  /* 占位高度，根据实际 header 高度调整 */
  height: 110rpx; 
  /* #ifdef MP-WEIXIN */
  height: 180rpx;
  /* #endif */
}

.search-bar {
  flex: 1;
  height: 72rpx;
  background-color: #f5f5f5;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  margin-right: 20rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  margin-left: 10rpx;
  color: #333;
  height: 100%;
}

.close-icon {
  padding: 10rpx;
}

.search-btn {
  font-size: 30rpx;
  color: #ff6b35;
  font-weight: bold;
}

/* 移除原有的 location 样式 */

.category-scroll {
  white-space: nowrap;
  background-color: #fff;
  padding: 20rpx 0;
  position: relative; /* 确保层级 */
  z-index: 1; 
}

.category-list {
  display: inline-flex;
  padding: 0 30rpx;
}

.category-item {
  padding: 10rpx 30rpx;
  margin-right: 20rpx;
  border-radius: 50rpx;
  background-color: #f5f5f5;
  color: #666;
  font-size: 26rpx;
}

.category-item.active {
  background-color: #ff6b35;
  color: #fff;
}

.goods-list {
  padding: 30rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.goods-item {
  display: flex;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.goods-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
  flex-shrink: 0; /* 防止图片被挤压 */
  background-color: #eee;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-title {
  font-size: 30rpx;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.goods-price {
  margin-top: 15rpx;
}

.price {
  color: #ff6b35;
  font-size: 36rpx;
  font-weight: bold;
}

.original-price {
  color: #999;
  font-size: 24rpx;
  text-decoration: line-through;
  margin-left: 10rpx;
}

.goods-meta {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
  justify-content: space-between; /* 让时间和地点分开展示 */
}

.user-info {
  margin-top: 15rpx;
  display: flex;
  align-items: center;
}

.avatar {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  margin-right: 10rpx;
  background-color: #eee;
}

.username {
  font-size: 24rpx;
  color: #666;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>