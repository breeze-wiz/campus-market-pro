'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database()
  const collection = db.collection('goods')
  
  console.log('收到发布请求，完整数据:', JSON.stringify(event, null, 2));
  
  try {
    // 方法一：直接从event中获取前端传递的userId
    const userId = event.userId || event.uid;
    
    if (!userId) {
      console.error('错误：缺少用户ID', event);
      return {
        code: 401,
        message: '用户信息缺失，请重新登录',
        debug: event // 返回前端传来的数据用于调试
      }
    }
    
    // 准备要插入的数据
    const goodsData = {
      title: event.title,
      description: event.description || '',
      category: event.category,
      price: event.price,
      originalPrice: event.originalPrice,
      location: event.location || '',
      contact: event.contact,
      images: event.images || [],
      userId: userId,                    // 使用前端传入的userId
      userName: event.userName || '用户',
      userAvatar: event.userAvatar || '',
      status: 'onSale',
      createTime: Date.now(),
      updateTime: Date.now()
    };
    
    console.log('准备写入的数据:', goodsData);
    
    // 插入数据到数据库
    const result = await collection.add(goodsData)
    console.log('数据库写入成功，ID:', result.id);
    
    return {
      code: 200,
      message: '发布成功',
      data: {
        id: result.id,
        goodsId: result.id
      }
    }
    
  } catch (error) {
    console.error('发布商品失败:', error)
    return {
      code: 500,
      message: '发布失败: ' + (error.message || error.errMsg),
      errorDetail: error.toString()
    }
  }
}