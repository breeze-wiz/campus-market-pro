'use strict';
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
  // 1. 获取前端传来的参数
  const { 
    keyword,    // 搜索关键词
    category,   // 分类
    page = 1, 
    pageSize = 10 
  } = event
  
  // 2. 构造查询条件
  let match = {
    status: 'onSale' // 默认只查在售的
  }
  
  // 如果有分类参数
  if (category && category !== 'all') {
    match.category = category
  }
  
  // 重点：如果前端传了 keyword，则进行模糊查询
  if (keyword && keyword.trim() !== '') {
    // 使用正则进行模糊匹配，匹配标题 OR 描述
    match = dbCmd.and([
      match, // 必须满足在售、分类等条件
      dbCmd.or([
        { title: new RegExp(keyword, 'i') },      // 标题包含关键词
        { description: new RegExp(keyword, 'i') } // 或者描述包含关键词
      ])
    ])
  }

  // 3. 查询数据库
  const skip = (page - 1) * pageSize
  
  try {
    const res = await db.collection('goods')
      .where(match)
      .skip(skip)
      .limit(pageSize)
      .orderBy('createTime', 'desc') // 按时间倒序
      .get()
      
    // 4. 返回结果
    return {
      code: 200,
      msg: 'success',
      data: res.data
    }
    
  } catch (e) {
    console.error(e)
    return {
      code: 500,
      msg: '获取失败',
      error: e
    }
  }
};