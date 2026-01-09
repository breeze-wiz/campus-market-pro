'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
  const { userId, status, page = 1, pageSize = 10 } = event
  
  // 核心修复：必须构造 where 条件过滤 userId
  let whereObj = {
    userId: userId // 只查当前用户
  }
  
  // 如果有状态筛选（在售/已售）
  if (status && status !== 'all') {
    whereObj.status = status
  }

  const res = await db.collection('goods')
    .where(whereObj)
    .orderBy('createTime', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return {
    code: 200,
    msg: '查询成功',
    data: res.data
  }
};