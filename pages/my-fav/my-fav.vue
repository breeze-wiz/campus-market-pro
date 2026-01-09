<template>
  <view class="container">
    <view v-if="list.length > 0">
      <view class="goods-item" v-for="item in list" :key="item._id" @click="goDetail(item.goodsId)">
        <image class="cover" :src="item.goodsData ? item.goodsData.image : '/static/default-goods.png'" mode="aspectFill"></image>
        <view class="info">
          <text class="title">{{ item.goodsData ? item.goodsData.title : '商品信息已失效' }}</text>
          <view class="bottom">
            <text class="price">¥{{ item.goodsData ? item.goodsData.price : '0' }}</text>
            <view class="del-btn" @click.stop="removeFav(item._id)">取消收藏</view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="empty" v-else>
      <text>还没有收藏任何商品哦~</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return { list: [] }
  },
  async onShow() {
      this.loadFavorites();
  },
  methods: {
    async loadFavorites() {
        const user = uni.getStorageSync('user');
        if (!user) return;
        
        const db = uniCloud.database();
        try {
            const res = await db.collection('favorites').where({
                userId: user._id
            }).get();
            
            // 打印一下数据，方便你在控制台查看具体的结构
            console.log("收藏列表原始数据：", res.result.data);
            
            // 关键修复：确保赋值给 list
            this.list = res.result.data; 
        } catch (e) {
            console.error("加载收藏失败", e);
        }
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
    },
    async removeFav(id) {
      await uniCloud.database().collection('favorites').doc(id).remove()
      uni.showToast({ title: '已取消' })
      this.loadFavList() // 刷新列表
    }
  }
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f8f8f8; min-height: 100vh; }
.goods-item { display: flex; background: #fff; padding: 20rpx; border-radius: 15rpx; margin-bottom: 20rpx; }
.cover { width: 160rpx; height: 160rpx; border-radius: 10rpx; }
.info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.title { font-size: 30rpx; color: #333; }
.bottom { display: flex; justify-content: space-between; align-items: center; }
.price { color: #ff6b35; font-size: 32rpx; font-weight: bold; }
.del-btn { font-size: 24rpx; color: #999; border: 1rpx solid #ddd; padding: 4rpx 15rpx; border-radius: 20rpx; }
.empty { text-align: center; margin-top: 100rpx; color: #999; }
</style>