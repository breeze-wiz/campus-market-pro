'use strict';
const db = uniCloud.database();
const _ = db.command;

exports.main = async (event, context) => {
	const { userId } = event;
	if (!userId) return { code: 400, msg: '未登录' };

	try {
		// 1. 获取消息列表
		const res = await db.collection('chat-messages')
			.where(_.or([{ senderId: userId }, { receiverId: userId }]))
			.orderBy('createTime', 'desc')
			.get();

		const allMsgs = res.data;
		const chatGroups = {};

		// 2. 提取联系人 ID
		allMsgs.forEach(msg => {
			const peerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
			if (!chatGroups[peerId]) {
				chatGroups[peerId] = {
					peerId: peerId,
					lastContent: msg.content,
					lastTime: msg.createTime,
					goodsId: msg.goodsId,
					nickname: '用户' + peerId.substring(0, 4),
					avatar: ''
				};
			}
		});

		const peerIds = Object.keys(chatGroups);
		if (peerIds.length > 0) {
			// --- 关键修正：使用你数据库里的真实表名 users ---
			const userRes = await db.collection('users')
				.where({ _id: _.in(peerIds) })
				.field({ 'nickname': true, 'username': true, 'avatar': true })
				.get();

			userRes.data.forEach(user => {
				if (chatGroups[user._id]) {
					chatGroups[user._id].nickname = user.nickname || user.username || chatGroups[user._id].nickname;
					chatGroups[user._id].avatar = user.avatar;
				}
			});
		}

		return { code: 200, data: Object.values(chatGroups) };
	} catch (e) {
		return { code: 500, msg: e.message };
	}
};