<template>
	<view class="container">
		<swiper class="goods-swiper" indicator-dots autoplay circular>
			<swiper-item v-for="(img, index) in goodsInfo.images" :key="index">
				<image class="goods-image" :src="img" mode="aspectFit" @click="previewImage(index)"></image>
			</swiper-item>
		</swiper>

		<view class="goods-card">
			<view class="price-section">
				<text class="current-price">¥{{ goodsInfo.price }}</text>
				<text class="original-price" v-if="goodsInfo.originalPrice">¥{{ goodsInfo.originalPrice }}</text>
				<text class="status-tag">{{ statusMap[goodsInfo.status] }}</text>
			</view>

			<view class="title-section">
				<text class="goods-title">{{ goodsInfo.title }}</text>
				<view class="view-count">
					<uni-icons type="eye" size="16" color="#999"></uni-icons>
					<text>{{ goodsInfo.viewCount || 0 }} 浏览</text>
				</view>
			</view>

			<view class="info-section">
				<view class="info-item">
					<uni-icons type="list" size="18" color="#666"></uni-icons>
					<text class="label">分类：</text>
					<text>{{ categoryMap[goodsInfo.category] || '其他' }}</text>
				</view>
				<view class="info-item">
					<uni-icons type="location" size="18" color="#666"></uni-icons>
					<text class="label">交易地点：</text>
					<text>{{ goodsInfo.location }}</text>
				</view>
				<view class="info-item">
					<uni-icons type="phone" size="18" color="#666"></uni-icons>
					<text class="label">联系方式：</text>
					<text>{{ goodsInfo.contact }}</text>
				</view>
				<view class="info-item">
					<uni-icons type="calendar" size="18" color="#666"></uni-icons>
					<text class="label">发布时间：</text>
					<text>{{ formatTime(goodsInfo.createTime) }}</text>
				</view>
			</view>
		</view>

		<view class="description-card">
			<text class="section-title">商品描述</text>
			<text class="description-content">{{ goodsInfo.description || '暂无描述' }}</text>
		</view>

		<view class="user-card" @click="goUserPage">
			<image class="user-avatar" :src="goodsInfo.userAvatar || '/static/default-avatar.png'"></image>
			<view class="user-info">
				<text class="username">{{ goodsInfo.userName }}</text>
				<text class="user-tag">发布者</text>
			</view>
			<uni-icons type="arrowright" size="20" color="#999"></uni-icons>
		</view>

		<view class="action-bar-fixed" v-if="goodsInfo.status === 'onSale'">
			<view class="bar-content">
				<view class="fav-section" @click.stop="toggleFavorite" hover-class="btn-hover">
					<uni-icons :type="isFav ? 'star-filled' : 'star'" size="26" :color="isFav ? '#ff6b35' : '#666'"></uni-icons>
					<text :class="['fav-text', isFav ? 'fav-active' : '']">{{ isFav ? '已收藏' : '收藏' }}</text>
				</view>

				<view class="chat-section">
					<view class="chat-btn-box" @click.stop="startChat" hover-class="btn-hover-opacity">
						<uni-icons type="chat" size="20" color="#fff"></uni-icons>
						<text>联系卖家</text>
					</view>
				</view>

				<view class="buy-section">
					<view class="buy-btn-box" @click.stop="handleBuy" hover-class="btn-hover-opacity">
						<text>我想要</text>
					</view>
				</view>
			</view>
		</view>

		<view class="sold-tip-bar" v-else-if="goodsInfo.status === 'sold'">
			<text>该商品已售出</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				goodsId: '',
				isFav: false,
				goodsInfo: {
					title: '', price: 0, images: [], description: '', category: '',
					location: '', contact: '', status: 'onSale', viewCount: 0,
					createTime: null, userName: '', userAvatar: '', userId: ''
				},
				categoryMap: { 'book': '图书教材', 'digital': '数码产品', 'daily': '生活用品', 'clothes': '服饰鞋包', 'other': '其他' },
				statusMap: { 'onSale': '出售中', 'sold': '已售出', 'offShelf': '已下架' }
			}
		},
		async onLoad(options) {
			if (options.id) {
				this.goodsId = options.id;
				await this.loadGoodsDetail();
				this.checkIfFavorite();
				this.increaseViewCount();
			}
		},
		methods: {
			async loadGoodsDetail() {
				try {
					const db = uniCloud.database();
					const res = await db.collection('goods').doc(this.goodsId).get();
					if (res.result.data && res.result.data.length > 0) {
						this.goodsInfo = res.result.data[0];
					}
				} catch (e) { console.error("获取详情失败", e); }
			},

			async checkIfFavorite() {
			    const user = uni.getStorageSync('user');
			    if (!user || !user._id) return;
			    
			    const db = uniCloud.database();
			    try {
			        // 注意：这里必须用 user._id 且字段名必须是 userId
			        const res = await db.collection('favorites').where({
			            userId: user._id, 
			            goodsId: this.goodsId
			        }).get();
			        
			        // 只有查到数据了，才把 isFav 设为 true
			        if (res.result.data && res.result.data.length > 0) {
			            this.isFav = true;
			        } else {
			            this.isFav = false;
			        }
			    } catch (e) {
			        console.log("检查状态失败", e);
			    }
			},

			async toggleFavorite() {
			    const user = uni.getStorageSync('user');
			    if (!user || !user._id) {
			        uni.showToast({ title: '请先登录', icon: 'none' });
			        return;
			    }
			
			    uni.showLoading({ title: '处理中...', mask: true });
			
			    try {
			        // 调用我们刚刚写的云函数
			        const res = await uniCloud.callFunction({
			            name: 'toggleFavorite',
			            data: {
			                userId: user._id,
			                goodsId: this.goodsId,
			                goodsData: {
			                    title: this.goodsInfo.title,
			                    price: this.goodsInfo.price,
			                    image: this.goodsInfo.images[0]
			                }
			            }
			        });
			
			        if (res.result.code === 200) {
			            this.isFav = res.result.isFav; // 根据云函数返回的状态更新UI
			            uni.showToast({
			                title: res.result.msg,
			                icon: this.isFav ? 'success' : 'none'
			            });
			        } else {
			            throw new Error(res.result.msg);
			        }
			    } catch (e) {
			        console.error("云函数调用失败:", e);
			        uni.showModal({
			            title: '提示',
			            content: '收藏失败，请检查网络或重新登录',
			            showCancel: false
			        });
			    } finally {
			        uni.hideLoading();
			    }
			},

			async handleBuy() {
				const user = uni.getStorageSync('user');
				if (!user) { uni.showToast({ title: '请先登录', icon: 'none' }); return; }
				
				uni.showModal({
					title: '确认购买',
					content: `确定购买【${this.goodsInfo.title}】?`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' });
							try {
								const db = uniCloud.database();
								await db.collection('goods').doc(this.goodsId).update({
									status: 'sold'
									// 这里暂时不传 updateTime，避开时间格式报错
								});
								this.goodsInfo.status = 'sold';
								uni.showToast({ title: '购买成功' });
							} catch (e) {
								uni.showToast({ title: '操作失败:' + e.message, icon: 'none' });
							} finally {
								uni.hideLoading();
							}
						}
					}
				});
			},

			async increaseViewCount() {
				const db = uniCloud.database();
				db.collection('goods').doc(this.goodsId).update({
					viewCount: db.command.inc(1)
				});
			},

			previewImage(index) {
				uni.previewImage({ current: index, urls: this.goodsInfo.images });
			},

			formatTime(time) {
				if (!time) return '刚刚';
				try {
					let date = new Date(time);
					// 如果日期无效，尝试直接解析
					if (isNaN(date.getTime())) return '刚刚';
					return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
				} catch (e) {
					return '刚刚';
				}
			},

			startChat() {
				const user = uni.getStorageSync('user');
				if (!user) { uni.navigateTo({ url: '/pages/login/login' }); return; }
				if (user._id === this.goodsInfo.userId) {
					uni.showToast({ title: '这是你自己发布的', icon: 'none' });
					return;
				}
				uni.navigateTo({
					url: `/pages/chat/chat?toUserId=${this.goodsInfo.userId}&goodsId=${this.goodsId}&nickname=${this.goodsInfo.userName}`
				});
			},

			goUserPage() {
				uni.showToast({ title: '功能开发中', icon: 'none' });
			}
		}
	}
</script>

<style scoped>
	.container { background-color: #f8f8f8; min-height: 100vh; padding-bottom: 140rpx; }
	.goods-swiper { height: 600rpx; background-color: #fff; }
	.goods-image { width: 100%; height: 100%; }
	.goods-card, .description-card, .user-card { background-color: #fff; padding: 30rpx; margin-top: 20rpx; }
	.price-section { display: flex; align-items: center; margin-bottom: 10rpx; }
	.current-price { font-size: 50rpx; color: #ff6b35; font-weight: bold; }
	.status-tag { margin-left: auto; padding: 4rpx 16rpx; background-color: #f0f9ff; color: #1890ff; font-size: 24rpx; border-radius: 8rpx; }
	.goods-title { font-size: 36rpx; font-weight: bold; color: #333; display: block; }
	.view-count { font-size: 24rpx; color: #999; margin-top: 10rpx; display: flex; align-items: center; }
	.info-item { display: flex; align-items: center; margin-top: 15rpx; font-size: 28rpx; color: #666; }
	.info-item .label { color: #999; width: 150rpx; }
	.section-title { font-size: 32rpx; font-weight: bold; margin-bottom: 20rpx; display: block; }
	.description-content { font-size: 28rpx; color: #666; line-height: 1.6; }
	.user-card { display: flex; align-items: center; }
	.user-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; margin-right: 20rpx; }
	.user-info { flex: 1; }
	.username { font-size: 30rpx; font-weight: bold; display: block; }
	.user-tag { font-size: 22rpx; color: #999; }

	.action-bar-fixed {
		position: fixed; bottom: 0; left: 0; right: 0;
		height: 120rpx; background-color: #fff; z-index: 9999;
		border-top: 1rpx solid #eee; padding-bottom: env(safe-area-inset-bottom);
	}
	.bar-content { display: flex; height: 100%; align-items: center; padding: 0 20rpx; }
	.fav-section { width: 120rpx; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
	.fav-text { font-size: 22rpx; color: #666; margin-top: 4rpx; }
	.fav-active { color: #ff6b35; }
	.chat-section { flex: 1; padding: 0 15rpx; }
	.chat-btn-box { height: 80rpx; background-color: #07c160; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28rpx; }
	.buy-section { width: 220rpx; flex-shrink: 0; }
	.buy-btn-box { height: 80rpx; background-color: #ff6b35; color: #fff; border-radius: 40rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: bold; }
	.btn-hover { background-color: #f5f5f5; }
	.btn-hover-opacity { opacity: 0.8; }
	.sold-tip-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 120rpx; background-color: #f8f8f8; color: #999; display: flex; align-items: center; justify-content: center; z-index: 9999; }
</style>