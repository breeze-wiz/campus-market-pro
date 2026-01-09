<template>
	<view class="container">
		<view class="header">
			<text class="nickname">{{ toNickname }}</text>
		</view>

		<scroll-view class="msg-list" scroll-y :scroll-into-view="lastMsgId" scroll-with-animation>
			<view v-for="(item, index) in msgList" :key="index" :id="'msg-' + index" class="msg-item"
				:class="item.senderId === mineId ? 'msg-mine' : 'msg-other'">
				
				<image class="avatar" :src="item.senderId === mineId ? myAvatar : toAvatar"></image>
				
				<view class="msg-content">
					<text class="text">{{ item.content }}</text>
					<text class="time">{{ formatTime(item.createTime) }}</text>
				</view>
			</view>
			<view id="bottom-place" style="height: 20rpx;"></view>
		</scroll-view>

		<view class="input-section">
			<input class="input" v-model="inputText" confirm-type="send" @confirm="sendMessage" placeholder="输入消息..." />
			<button class="send-btn" @click="sendMessage">发送</button>
		</view>
	</view>
</template>
<script>
	export default {
		data() {
			return {
				mineId: '',
				myAvatar: '/static/default-avatar.png',
				toUserId: '',
				toNickname: '联系人',
				toAvatar: '/static/default-avatar.png',
				goodsId: '',
				inputText: '',
				msgList: [],
				lastMsgId: '',
				timer: null
			}
		},
		onLoad(options) {
			this.toUserId = options.toUserId;
			this.toNickname = options.nickname || '卖家';
			this.goodsId = options.goodsId;

			const user = uni.getStorageSync('user');
			if (user) {
				this.mineId = user._id;
				this.myAvatar = user.avatar || '/static/default-avatar.png';
			}

			// 首次加载消息
			this.loadMessages();

			// 开启轮询：建议将时间稍微调长（如 5 秒），以节省你宝贵的 RU 额度
			this.timer = setInterval(() => {
				this.loadMessages();
			}, 5000);
		},
		onUnload() {
			if (this.timer) {
				clearInterval(this.timer);
			}
		},
		methods: {
			async loadMessages() {
			    // 增加一个防御，确保 ID 都存在
			    if (!this.mineId || !this.toUserId) {
			        console.log('ID 缺失，无法查询:', { mineId: this.mineId, toUserId: this.toUserId });
			        return;
			    }
			    
			    const db = uniCloud.database();
			    try {
			        // 使用更稳健的查询方式
			        const res = await db.collection('chat-messages')
			            .where(`(senderId == "${this.mineId}" && receiverId == "${this.toUserId}") || (senderId == "${this.toUserId}" && receiverId == "${this.mineId}")`)
			            .orderBy('createTime', 'asc')
			            .get();
			
			        if (res.result && res.result.data) {
			            // 只有当消息数真的变化了，才更新列表，防止闪烁
			            if (res.result.data.length !== this.msgList.length) {
			                this.msgList = res.result.data;
			                this.scrollToBottom();
			            }
			        }
			    } catch (e) {
			        // 如果这里报错，控制台会打印出具体原因
			        console.error('前端读取消息失败，请检查 Schema 权限:', e);
			    }
			},

			async sendMessage() {
				if (!this.inputText.trim()) return;

				const content = this.inputText; // 先存起来
				this.inputText = ''; // 立即清空，防止重复点击

				try {
					// 核心修改：改用调用云函数发送，避开前端权限报错
					const res = await uniCloud.callFunction({
						name: 'sendMessage',
						data: {
							senderId: this.mineId,
							receiverId: this.toUserId,
							goodsId: this.goodsId,
							content: content
						}
					});

					if (res.result && res.result.code === 200) {
						// 发送成功，刷新一次列表
						this.loadMessages();
					} else {
						uni.showToast({ title: '发送失败: ' + (res.result.msg || ''), icon: 'none' });
						this.inputText = content; // 失败了把文字还给用户
					}
				} catch (e) {
					uni.showToast({ title: '系统错误', icon: 'none' });
					this.inputText = content;
				}
			},

			scrollToBottom() {
				this.$nextTick(() => {
					this.lastMsgId = 'msg-' + (this.msgList.length - 1);
				});
			},

			formatTime(ts) {
				if (!ts) return '';
				const date = new Date(ts);
				return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
			}
		}
	}
</script>

<style scoped>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f2f2f2;
	}

	.header {
		padding: 20rpx;
		background-color: #fff;
		text-align: center;
		border-bottom: 1rpx solid #ddd;
	}

	.nickname {
		font-weight: bold;
		font-size: 32rpx;
	}

	.msg-list {
		flex: 1;
		padding: 20rpx;
		overflow: hidden;
	}

	.msg-item {
		display: flex;
		margin-bottom: 30rpx;
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 10rpx;
	}

	.msg-content {
		max-width: 70%;
		margin: 0 20rpx;
		position: relative;
	}

	.text {
		display: inline-block;
		padding: 20rpx;
		border-radius: 10rpx;
		font-size: 28rpx;
		word-break: break-all;
	}

	.time {
		font-size: 20rpx;
		color: #999;
		display: block;
		margin-top: 10rpx;
	}

	/* 对方的消息：白底黑字，头像在左 */
	.msg-other {
		flex-direction: row;
	}

	.msg-other .text {
		background-color: #fff;
		color: #333;
	}

	/* 我的消息：绿底黑字，头像在右 */
	.msg-mine {
		flex-direction: row-reverse;
	}

	.msg-mine .text {
		background-color: #95ec69;
		color: #000;
	}

	.input-section {
		display: flex;
		padding: 20rpx;
		background-color: #f7f7f7;
		border-top: 1rpx solid #ddd;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.input {
		flex: 1;
		background-color: #fff;
		height: 80rpx;
		padding: 0 20rpx;
		border-radius: 10rpx;
		font-size: 28rpx;
	}

	.send-btn {
		width: 140rpx;
		height: 80rpx;
		margin-left: 20rpx;
		background-color: #07c160;
		color: #fff;
		font-size: 28rpx;
		line-height: 80rpx;
	}
</style>