// 项目配置文件
export default {
  // API基础URL
  baseUrl: 'https://你的云服务空间地址.bspapp.com',
  
  // 应用配置
  appName: '校园闲置交易平台',
  appVersion: '1.0.0',
  
  // 商品分类配置
  categories: [
    { id: 'book', name: '图书教材', icon: 'book' },
    { id: 'digital', name: '数码产品', icon: 'phone' },
    { id: 'daily', name: '生活用品', icon: 'home' },
    { id: 'clothes', name: '服饰鞋包', icon: 'clothes' },
    { id: 'other', name: '其他', icon: 'more' }
  ],
  
  // 商品状态
  goodsStatus: {
    onSale: '出售中',
    sold: '已售出',
    offShelf: '已下架'
  },
  
  // 分页配置
  pagination: {
    pageSize: 10
  }
}