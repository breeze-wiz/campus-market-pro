'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { userId, goodsId, goodsData } = event;
	if (!userId || !goodsId) return { code: 400, msg: '参数不足' };

	const favRes = await db.collection('favorites').where({
		userId: userId,
		goodsId: goodsId
	}).get();

	if (favRes.data.length > 0) {
		await db.collection('favorites').doc(favRes.data[0]._id).remove();
		return { code: 200, isFav: false, msg: '已取消收藏' };
	} else {
		// 统一格式写入
		await db.collection('favorites').add({
			userId: userId,
			goodsId: goodsId,
			// 确保这里存的是一个对象
			goodsData: {
				title: goodsData.title,
				price: goodsData.price,
				image: goodsData.image
			},
			createTime: Date.now()
		});
		return { code: 200, isFav: true, msg: '收藏成功' };
	}
};