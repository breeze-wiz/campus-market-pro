'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { userId } = event;
  
  if (!userId) {
    return { code: 400, msg: '缺少用户ID', data: {} };
  }
  
  try {
    // 查询在售数量
    const onSaleRes = await db.collection('goods')
      .where({ userId: userId, status: 'onSale' })
      .count();
    
    // 查询已售数量
    const soldRes = await db.collection('goods')
      .where({ userId: userId, status: 'sold' })
      .count();
    
    // 查询收藏数量（需要先创建收藏表）
    // const favoritesRes = await db.collection('favorites')
    //   .where({ userId: userId })
    //   .count();
    
    // 查询未读消息（需要先创建消息表）
    // const unreadRes = await db.collection('messages')
    //   .where({ toUserId: userId, read: false })
    //   .count();
    
    return {
      code: 200,
      msg: '获取成功',
      data: {
        onSale: onSaleRes.result.total || 0,
        sold: soldRes.result.total || 0,
        favorites: 0, // 暂时为0
        unread: 0     // 暂时为0
      }
    };
    
  } catch (error) {
    console.error('查询用户统计失败:', error);
    return {
      code: 500,
      msg: '获取失败',
      data: { onSale: 0, sold: 0, favorites: 0, unread: 0 }
    };
  }
};