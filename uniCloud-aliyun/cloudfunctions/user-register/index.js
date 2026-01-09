'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  // 1. 获取前端传来的参数
  const { username, password, phone } = event;

  // 2. 后端基础校验
  if (!username || !password || !phone) {
    return { code: 400, msg: '参数不完整' };
  }

  try {
    // 3. 查重：检查用户名或手机号是否已存在
    // 云函数查询不受 Schema 权限限制
    const userSearch = await db.collection('users').where(
      db.command.or([
        { username: username },
        { phone: phone }
      ])
    ).get();

    if (userSearch.data.length > 0) {
      return { code: 401, msg: '用户名或手机号已被注册' };
    }

    // 4. 写入数据库
    // 注意：建议在前端传入前或在此处对 password 进行加密（如使用 crypto 模块）
    const res = await db.collection('users').add({
      username,
      password, 
      phone,
      createTime: Date.now(),
      lastLoginTime: Date.now()
    });

    return {
      code: 200,
      msg: '注册成功',
      data: { id: res.id }
    };

  } catch (e) {
    return {
      code: 500,
      msg: '服务器错误：' + e.message
    };
  }
};