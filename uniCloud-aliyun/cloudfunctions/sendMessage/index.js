'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
	const { senderId, receiverId, goodsId, content } = event;
	
	if (!senderId || !receiverId || !content) {
		return { code: 400, msg: '参数不完整' }
	}

	try {
		await db.collection('chat-messages').add({
			senderId,
			receiverId,
			goodsId,
			content,
			createTime: Date.now()
		});
		return { code: 200, msg: '发送成功' }
	} catch (e) {
		return { code: 500, msg: e.message }
	}
};