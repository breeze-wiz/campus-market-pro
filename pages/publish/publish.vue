<template>
  <view class="container">
    <scroll-view class="scroll-view" scroll-y>
      <!-- 图片上传 -->
      <view class="upload-section">
        <text class="section-title">商品图片（最多9张）</text>
        <view class="upload-list">
          <view 
            v-for="(item, index) in imageList" 
            :key="index"
            class="upload-item"
          >
            <image 
              class="upload-image" 
              :src="item" 
              mode="aspectFill"
              @click="previewImage(index)"
            ></image>
            <view class="delete-btn" @click="deleteImage(index)">
              <uni-icons type="closeempty" size="20" color="#fff"></uni-icons>
            </view>
          </view>
          <view 
            class="upload-btn" 
            @click="chooseImage"
            v-if="imageList.length < 9"
          >
            <uni-icons type="plusempty" size="40" color="#ccc"></uni-icons>
            <text class="upload-text">添加图片</text>
          </view>
        </view>
      </view>
      
      <!-- 商品信息 -->
      <view class="form-section">
        <view class="form-item">
          <text class="label">商品标题</text>
          <input 
            class="input" 
            v-model="formData.title" 
            placeholder="请输入商品标题"
            maxlength="30"
          />
          <text class="word-count">{{ formData.title.length }}/30</text>
        </view>
        
        <view class="form-item">
          <text class="label">商品描述</text>
          <textarea 
            class="textarea" 
            v-model="formData.description" 
            placeholder="请详细描述商品信息..."
            maxlength="500"
          />
          <text class="word-count">{{ formData.description.length }}/500</text>
        </view>
        
        <view class="form-item">
          <text class="label">商品分类</text>
          <picker 
            @change="bindPickerChange" 
            :value="categoryIndex" 
            :range="categoryArray"
          >
            <view class="picker">
              {{ formData.category ? categoryMap[formData.category] : '请选择分类' }}
              <uni-icons type="arrowright" size="16" color="#999"></uni-icons>
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <text class="label">价格</text>
          <view class="price-input">
            <text class="unit">¥</text>
            <input 
              class="input price" 
              v-model="formData.price" 
              type="number"
              placeholder="0.00"
            />
          </view>
        </view>
        
        <view class="form-item">
          <text class="label">原价（可选）</text>
          <view class="price-input">
            <text class="unit">¥</text>
            <input 
              class="input price" 
              v-model="formData.originalPrice" 
              type="number"
              placeholder="0.00"
            />
          </view>
        </view>
        
        <view class="form-item">
          <text class="label">交易偏好（可选）</text>
          <input 
            class="input" 
            v-model="formData.locationNote" 
            placeholder="例如：希望在东校区交易、可送货到宿舍楼等"
            maxlength="50"
          />
          <text class="tip-text">具体交易地点可在成交后与买家聊天约定</text>
        </view>
        
        <view class="form-item">
          <text class="label">联系方式</text>
          <input 
            class="input" 
            v-model="formData.contact" 
            placeholder="请输入手机号或微信号"
          />
        </view>
      </view>
      
      <!-- 发布按钮 -->
      <view class="publish-btn" @click="handlePublish">
        <text>发布商品</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
const db = uniCloud.database()

export default {
  data() {
    return {
	  isEdit: false, // 是否是编辑模式
	  editId: '',    // 正在编辑的商品ID
      imageList: [],
      categoryIndex: 0,
      categoryArray: ['图书教材', '数码产品', '生活用品', '服饰鞋包', '其他'],
      categoryMap: {
        'book': '图书教材',
        'digital': '数码产品',
        'daily': '生活用品',
        'clothes': '服饰鞋包',
        'other': '其他'
      },
      formData: {
        title: '',
        description: '',
        category: '',
        price: '',
        originalPrice: '',
        location: '',
        contact: '',
        images: []
      },
      loading: false
    }
  },
  methods: {
    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 9 - this.imageList.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.imageList = [...this.imageList, ...res.tempFilePaths]
        }
      })
    },
    onLoad(options) {
      // 1. 判断是否有 id 传过来
      if (options.id) {
        this.isEdit = true; // 在 data 里定义这个变量
        this.editId = options.id; // 在 data 里定义这个变量
        uni.setNavigationBarTitle({ title: '编辑商品' });
        this.loadOldData(options.id);
      }
    },
	
	async loadOldData(id) {
	    uni.showLoading({ title: '加载中...' });
	    try {
	      // 直接从数据库获取当前商品信息
	      const res = await uniCloud.database().collection('goods').doc(id).get();
	      if (res.result.data && res.result.data.length > 0) {
	        const data = res.result.data[0];
	        // 将旧数据填充到表单绑定的 formData 中
	        this.formData = {
	          title: data.title,
	          description: data.description,
	          price: data.price,
	          category: data.category,
	          contact: data.contact,
	          locationNote: data.location,
	          originalPrice: data.originalPrice
	        };
	        // 填充图片预览列表
	        this.imageList = data.images || [];
	        // 同步分类选择器的索引
	        const categories = ['book', 'digital', 'daily', 'clothes', 'other'];
	        this.categoryIndex = categories.indexOf(data.category);
	      }
	    } catch (e) {
	      console.error('加载旧数据失败:', e);
	    } finally {
	      uni.hideLoading();
	    }
	  },
	
    // 删除图片
    deleteImage(index) {
      this.imageList.splice(index, 1)
    },
    
    // 预览图片
    previewImage(index) {
      uni.previewImage({
        current: index,
        urls: this.imageList
      })
    },
    
    // 选择分类
    bindPickerChange(e) {
      this.categoryIndex = e.detail.value
      const categories = ['book', 'digital', 'daily', 'clothes', 'other']
      this.formData.category = categories[this.categoryIndex]
    },
    
    // 选择地点
    chooseLocation() {
      uni.chooseLocation({
        success: (res) => {
          this.formData.location = res.name
          this.formData.latitude = res.latitude
          this.formData.longitude = res.longitude
        }
      })
    },
    
    // 发布商品
    // 发布商品
    async handlePublish() {
      // 1. 表单验证（保持不变）
      if (!this.validateForm()) return
      
      this.loading = true
      
      try {
        const user = uni.getStorageSync('user')
        if (!user) {
          uni.showToast({ title: '请先登录', icon: 'none' })
          return
        }
    
        // 2. 上传图片（保持不变）
        const imageUrls = []
        if (this.imageList.length > 0) {
          for (const tempFilePath of this.imageList) {
            // 如果是编辑模式，有些图片已经是云端链接(http...)了，不需要重复上传
            if (tempFilePath.indexOf('http') === 0) {
              imageUrls.push(tempFilePath)
              continue
            }
            const cloudPath = `goods/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`
            const res = await uniCloud.uploadFile({
              filePath: tempFilePath,
              cloudPath: cloudPath
            })
            imageUrls.push(res.fileID)
          }
        }
    
        // 3. 准备公共数据
        const goodsData = {
          title: this.formData.title,
          description: this.formData.description || '',
          category: this.formData.category,
          price: Number(this.formData.price),
          contact: this.formData.contact,
          images: imageUrls, // 这是上传后得到的图片数组
          updateTime: Date.now()
        };
    
        let result;
        
        // --- 【第四步的核心逻辑就在这里】 ---
        if (this.isEdit) {
          // 如果是编辑模式，调用更新
          result = await uniCloud.callFunction({
            name: 'update-goods-status', // 确保你有这个云函数，或者改用修改商品的云函数
            data: {
              goodsId: this.editId,
              ...goodsData
            }
          })
        } else {
          // 如果是新增模式，补充用户信息
          goodsData.userId = user._id
          goodsData.userName = user.nickname || user.username
          goodsData.userAvatar = user.avatar || ''
          goodsData.status = 'onSale'
          goodsData.createTime = Date.now()
          
          result = await uniCloud.callFunction({
            name: 'add-goods',
            data: goodsData
          })
        }
        // --- 【逻辑分流结束】 ---
    
        // 4. 处理返回结果（保持不变）
        if (result && result.result && result.result.code === 200) {
          uni.showToast({ title: this.isEdit ? '修改成功' : '发布成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack() // 修改完建议直接返回上一页
          }, 1500)
        } else {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
    
      } catch (error) {
        console.error('发生错误:', error)
        uni.showToast({ title: '系统错误', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    
    // 表单验证
    validateForm() {
      if (!this.formData.title.trim()) {
        uni.showToast({
          title: '请输入商品标题',
          icon: 'none'
        })
        return false
      }
      
      if (this.formData.title.length < 2) {
        uni.showToast({
          title: '标题太短',
          icon: 'none'
        })
        return false
      }
      
      if (!this.formData.price) {
        uni.showToast({
          title: '请输入价格',
          icon: 'none'
        })
        return false
      }
      
      if (!this.formData.category) {
        uni.showToast({
          title: '请选择分类',
          icon: 'none'
        })
        return false
      }

      
      if (!this.formData.contact) {
        uni.showToast({
          title: '请输入联系方式',
          icon: 'none'
        })
        return false
      }
      
      return true
    }
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
}

.scroll-view {
  height: 100%;
}

.upload-section {
  background-color: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
}

.upload-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.upload-image {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
}

.delete-btn {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: #ff4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ccc;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-text {
  color: #999;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.form-section {
  background-color: #fff;
  padding: 30rpx;
}

.form-item {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.input {
  font-size: 28rpx;
  color: #333;
}

.textarea {
  width: 100%;
  height: 200rpx;
  font-size: 28rpx;
  color: #333;
}

.word-count {
  position: absolute;
  right: 0;
  bottom: 10rpx;
  font-size: 24rpx;
  color: #999;
}

.picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.price-input {
  display: flex;
  align-items: center;
}

.unit {
  font-size: 32rpx;
  color: #ff6b35;
  margin-right: 10rpx;
}

.input.price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b35;
}

.location-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.publish-btn {
  margin: 40rpx 30rpx;
  background-color: #ff6b35;
  color: #fff;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
}
</style>