<template>
	<view class="container">
		<view class="header">
			<text class="title">消息中心</text>
		</view>

		<view v-if="chatList.length > 0">
			<view class="chat-item" v-for="(item, index) in chatList" :key="index" @click="goChat(item)" hover-class="item-hover">
				<image class="avatar" :src="item.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
				
				<view class="chat-info">
					<view class="info-top">
						<text class="nickname">{{ item.nickname || '神秘用户' }}</text>
						<text class="time">{{ formatTime(item.lastTime) }}</text>
					</view>
					<text class="last-msg">{{ item.lastContent }}</text>
				</view>
				
				<uni-icons type="arrowright" size="16" color="#bbb"></uni-icons>
			</view>
		</view>

		<view class="empty" v-else>
			<image class="empty-img" src="/static/no-message.png" mode="aspectFit"></image>
			<text>还没有聊天记录，去首页转转吧~</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				chatList: [],
				mineId: ''
			}
		},
		onShow() {
			// 每次回到消息页面都刷新一次
			const user = uni.getStorageSync('user');
			if (user && user._id) {
				this.mineId = user._id;
				this.loadChatList();
			} else {
				this.chatList = [];
				// 如果没登录，可以根据需求跳转到登录页
				// uni.navigateTo({ url: '/pages/login/login' });
			}
		},
		methods: {
			// 获取消息列表
			async loadChatList() {
				uni.showLoading({ title: '加载消息...' });
				try {
					const res = await uniCloud.callFunction({
						name: 'getChatList',
						data: { userId: this.mineId }
					});
					
					if (res.result && res.result.code === 200) {
						this.chatList = res.result.data;
					} else {
						console.error("云函数返回错误:", res.result);
					}
				} catch (e) {
					console.error('获取列表失败:', e);
					uni.showToast({ title: '列表加载失败', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
			},

			// 点击进入聊天详情页
			goChat(item) {
				// 请务必确认你的路径是 /pages/chat/chat 还是 /pages/detail/chat
				// 如果点击没反应，请修改下方 url 路径
				const url = `/pages/chat/chat?toUserId=${item.peerId}&goodsId=${item.goodsId || ''}&nickname=${item.nickname}`;
				
				uni.navigateTo({
					url: url,
					fail: (err) => {
						console.error("页面跳转失败，请检查路径是否正确:", err);
						uni.showToast({
							title: '页面路径错误',
							icon: 'none'
						});
					}
				});
			},

			// 时间格式化：今天显示时分，往日显示月日
			formatTime(ts) {
				if (!ts) return '';
				const date = new Date(ts);
				const now = new Date();
				if (date.toDateString() === now.toDateString()) {
					return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
				}
				return `${date.getMonth() + 1}-${date.getDate()}`;
			}
		}
	}
</script>

<style scoped>
	.container {
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.header {
		background-color: #fff;
		padding: 30rpx;
		text-align: center;
		border-bottom: 1rpx solid #eee;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
	}

	.chat-item {
		display: flex;
		align-items: center;
		padding: 25rpx 30rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #f2f2f2;
	}
	
	.item-hover {
		background-color: #f9f9f9;
	}

	.avatar {
		width: 100rpx;
		height: 100rpx;
		border-radius: 12rpx;
		background-color: #f0f0f0;
		flex-shrink: 0;
	}

	.chat-info {
		flex: 1;
		margin: 0 20rpx;
		overflow: hidden;
	}

	.info-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.nickname {
		font-size: 30rpx;
		font-weight: bold;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.time {
		font-size: 24rpx;
		color: #bbb;
		flex-shrink: 0;
	}

	.last-msg {
		font-size: 26rpx;
		color: #888;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: block;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 300rpx;
		color: #999;
	}

	.empty-img {
		width: 160rpx;
		height: 160rpx;
		margin-bottom: 20rpx;
		opacity: 0.4;
	}
</style>