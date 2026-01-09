<template>
  <view class="container">
    <!-- 状态筛选 -->
    <view class="status-tabs">
      <view 
        v-for="status in statusList" 
        :key="status.value"
        :class="['status-tab', activeStatus === status.value ? 'active' : '']"
        @click="switchStatus(status.value)"
      >
        <text>{{ status.label }}</text>
      </view>
    </view>
    
    <!-- 商品列表 -->
    <scroll-view class="goods-list" scroll-y @scrolltolower="loadMore">
      <view 
        v-for="item in goodsList" 
        :key="item._id"
        class="goods-item"
        @click="goDetail(item._id)"
      >
        <image class="goods-img" :src="item.images[0] || '/static/default-goods.png'" mode="aspectFill"></image>
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <view class="goods-price">
            <text class="price">¥{{ item.price }}</text>
            <text v-if="item.originalPrice" class="original-price">¥{{ item.originalPrice }}</text>
          </view>
          <view class="goods-meta">
            <text class="status" :class="item.status">{{ statusMap[item.status] }}</text>
            <text class="time">{{ formatTime(item.createTime) }}</text>
          </view>
          <view class="actions">
            <view 
              class="action-btn edit" 
              @click.stop="editGoods(item._id)"
              v-if="item.status === 'onSale'"
            >
              <text>编辑</text>
            </view>
            <view 
              class="action-btn delete" 
              @click.stop="deleteGoods(item._id)"
            >
              <text>删除</text>
            </view>
            <view 
              class="action-btn mark-sold" 
              @click.stop="markAsSold(item._id)"
              v-if="item.status === 'onSale'"
            >
              <text>标记已售</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="goodsList.length === 0 && !loading">
        <image class="empty-icon" src="/static/empty-goods.png"></image>
        <text class="empty-text">暂无发布的商品</text>
        <view class="publish-btn" @click="goPublish">
          <text>去发布商品</text>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore">
        <text>{{ loading ? '加载中...' : '上拉加载更多' }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusList: [
        { value: 'onSale', label: '在售' },
        { value: 'sold', label: '已售' },
        { value: 'offShelf', label: '下架' },
        { value: 'all', label: '全部' }
      ],
      activeStatus: 'onSale',
      goodsList: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false,
      statusMap: {
        'onSale': '出售中',
        'sold': '已售出',
        'offShelf': '已下架'
      }
    };
  },
  onShow() {
    this.checkLogin();
    this.loadMyGoods();
  },
  methods: {
    checkLogin() {
      const user = uni.getStorageSync('user');
      if (!user) {
        uni.showModal({
          title: '提示',
          content: '请先登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              });
            } else {
              uni.switchTab({
                url: '/pages/index/index'
              });
            }
          }
        });
        return false;
      }
      return true;
    },
    
    async loadMyGoods() {
      if (!this.checkLogin()) return;
      
      this.loading = true;
      try {
        const user = uni.getStorageSync('user');
        const result = await uniCloud.callFunction({
          name: 'get-my-goods',
          data: {
            userId: user._id,
            status: this.activeStatus === 'all' ? null : this.activeStatus,
            page: this.page,
            pageSize: this.pageSize
          }
        });
        
        if (result.result.code === 200) {
          const newGoods = result.result.data;
          if (this.page === 1) {
            this.goodsList = newGoods;
          } else {
            this.goodsList = [...this.goodsList, ...newGoods];
          }
          this.hasMore = newGoods.length === this.pageSize;
        }
      } catch (error) {
        console.error('加载我的商品失败:', error);
      }
      this.loading = false;
    },
    
    switchStatus(status) {
      this.activeStatus = status;
      this.page = 1;
      this.goodsList = [];
      this.hasMore = true;
      this.loadMyGoods();
    },
    
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page++;
        this.loadMyGoods();
      }
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}-${date.getDate()}`;
    },
    
    goDetail(goodsId) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${goodsId}`
      });
    },
    
    goPublish() {
      uni.switchTab({
        url: '/pages/publish/publish'
      });
    },
    
    editGoods(goodsId) {
      console.log('准备编辑商品，ID为:', goodsId);
      uni.navigateTo({
        // 建议统一使用 id 这个名字
        url: `/pages/publish/publish?id=${goodsId}` 
      });
    },
    
    async deleteGoods(goodsId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个商品吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uniCloud.callFunction({
                name: 'delete-goods',
                data: { goodsId }
              });
              
              if (result.result.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                // 刷新列表
                this.page = 1;
                this.goodsList = [];
                this.loadMyGoods();
              }
            } catch (error) {
              console.error('删除失败:', error);
            }
          }
        }
      });
    },
    
    async markAsSold(goodsId) {
      uni.showModal({
        title: '标记已售',
        content: '确定要将这个商品标记为已售出吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uniCloud.callFunction({
                name: 'update-goods-status',
                data: { 
                  goodsId, 
                  status: 'sold',
                  updateTime: Date.now()
                }
              });
              
              if (result.result.code === 200) {
                uni.showToast({ title: '标记成功', icon: 'success' });
                // 刷新列表
                this.page = 1;
                this.goodsList = [];
                this.loadMyGoods();
              }
            } catch (error) {
              console.error('标记失败:', error);
            }
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.status-tabs {
  display: flex;
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.status-tab {
  flex: 1;
  text-align: center;
  padding: 15rpx 0;
  font-size: 28rpx;
  color: #666;
}

.status-tab.active {
  color: #ff6b35;
  font-weight: bold;
  border-bottom: 4rpx solid #ff6b35;
}

.goods-list {
  height: calc(100vh - 160rpx);
}

.goods-item {
  display: flex;
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
}

.goods-img {
  width: 200rpx;
  height: 200rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
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
  margin-top: 15rpx;
  display: flex;
  align-items: center;
  font-size: 24rpx;
}

.status {
  padding: 6rpx 15rpx;
  border-radius: 20rpx;
  margin-right: 20rpx;
}

.status.onSale {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status.sold {
  background-color: #fff3e0;
  color: #ff9800;
}

.status.offShelf {
  background-color: #f5f5f5;
  color: #999;
}

.time {
  color: #999;
}

.actions {
  margin-top: 20rpx;
  display: flex;
  gap: 20rpx;
}

.action-btn {
  padding: 10rpx 25rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.action-btn.edit {
  background-color: #e3f2fd;
  color: #2196f3;
}

.action-btn.delete {
  background-color: #ffebee;
  color: #f44336;
}

.action-btn.mark-sold {
  background-color: #e8f5e9;
  color: #4caf50;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 30rpx;
}

.empty-icon {
  width: 300rpx;
  height: 300rpx;
  opacity: 0.6;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 50rpx;
}

.publish-btn {
  background-color: #ff6b35;
  color: #fff;
  padding: 20rpx 50rpx;
  border-radius: 50rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>