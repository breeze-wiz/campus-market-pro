'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const { username, password } = event;

	if (!username || !password) {
		return { code: 400, msg: '参数不完整' };
	}

	// 云函数具有管理员权限，可以绕过 Schema 的 read 权限限制进行查询
	// 支持用户名或手机号登录
	const userRes = await db.collection('users').where(
		db.command.or([
			{ username: username },
			{ phone: username }
		])
	).get();

	if (userRes.data.length === 0) {
		return { code: 404, msg: '用户不存在' };
	}

	const user = userRes.data[0];

	// 校验密码（确保前端传过来的是加密后的字符串）
	if (user.password !== password) {
		return { code: 401, msg: '密码错误' };
	}

	// 登录成功，更新最后登录时间
	await db.collection('users').doc(user._id).update({
		lastLoginTime: Date.now()
	});

	// 为了安全，返回给前端的信息中删除密码
	delete user.password;

	return {
		code: 200,
		msg: '登录成功',
		userInfo: user
	};
};