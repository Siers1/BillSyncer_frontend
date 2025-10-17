<template>
  <div class="ticket-entry-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>基本资料</span>
        </div>
      </template>
      <el-tabs v-model="activeName">
        <el-tab-pane label="个人信息" name="first">
          <el-form
              ref="formRef1"
              :model="info.form"
              :rules="info.rules"
              label-position="left"
              @submit.prevent=""
              label-width="120px"
              class="ticket-form"
          >
            <!-- 头像上传区域 -->
            <el-form-item prop="avatarUrl" label="头像">
              <div class="avatar-container">
                <div class="avatar-wrapper">
                  <img 
                    v-if="previewImage" 
                    :src="previewImage" 
                    class="avatar-image" 
                    alt="头像预览" 
                  />
                  <el-avatar 
                    :size="70"
                    :src="info.form.avatarUrl" 
                    v-else-if="info.form.avatarUrl"
                  />
                  <el-avatar 
                    :size="70"
                    v-else 
                    class="name-avatar"
                  >
                    {{ info.form.name.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="upload-button">
                  <el-upload
                    action=""
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleAvatarChange"
                    accept="image/jpeg,image/png,image/gif,image/jpg"
                  >
                    <el-button type="primary">上传头像</el-button>
                  </el-upload>
                </div>
              </div>
            </el-form-item>

            <el-form-item prop="name" label="姓名">
              <el-input
                  v-model="info.form.name"
                  placeholder="请输入工号"
                  prefix-icon="User"
              >
              </el-input>
            </el-form-item>

            <el-form-item prop="phone" label="电话">
              <el-input
                  v-model="info.form.phone"
                  placeholder="请输入电话"
                  prefix-icon="Phone"
              >
              </el-input>
            </el-form-item>

            <!-- 地址选择 - 使用 Select 组件联动 -->
            <el-form-item label="所在地" required>
              <el-row :gutter="10" style="width: 100%;">
                <el-col :span="8">
                  <el-form-item prop="provinceId" style="margin-bottom: 0;">
                    <el-select
                        v-model="info.form.provinceId"
                        placeholder="请选择省份"
                        filterable
                        clearable
                        style="width: 100%;"
                        :loading="provinceLoading"
                        @change="handleProvinceChange"
                    >
                      <el-option
                          v-for="item in provinceList"
                          :key="item.id"
                          :label="item.name"
                          :value="item.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item prop="cityId" style="margin-bottom: 0;">
                    <el-select
                        v-model="info.form.cityId"
                        placeholder="请选择城市"
                        filterable
                        clearable
                        style="width: 100%;"
                        :loading="cityLoading"
                        :disabled="!info.form.provinceId || cityList.length === 0"
                        @change="handleCityChange"
                    >
                      <el-option
                          v-for="item in cityList"
                          :key="item.id"
                          :label="item.name"
                          :value="item.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item prop="districtId" style="margin-bottom: 0;">
                    <el-select
                        v-model="info.form.districtId"
                        placeholder="请选择区县"
                        filterable
                        clearable
                        style="width: 100%;"
                        :loading="districtLoading"
                        :disabled="!info.form.cityId || districtList.length === 0"
                        @change="handleDistrictChange"
                    >
                      <el-option
                          v-for="item in districtList"
                          :key="item.id"
                          :label="item.name"
                          :value="item.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item>
              <el-button
                  type="primary"
                  native-type="submit"
                  @click="save"
              >
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="second">
          <el-form
              ref="formRef2"
              :model="data.form"
              :rules="data.rules"
              label-position="left"
              @submit.prevent=""
              label-width="120px"
              class="ticket-form"
          >

            <el-form-item prop="oldPassword" label="原密码">
              <el-input
                  v-model="data.form.oldPassword"
                  type="password"
                  placeholder="请输入原密码"
                  show-password
                  clearable
                  prefix-icon="Lock"
              >
              </el-input>
            </el-form-item>

            <el-form-item prop="newPassword" label="新密码">
              <el-input
                  v-model="data.form.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  show-password
                  clearable
                  prefix-icon="Lock"
              >
              </el-input>
            </el-form-item>

            <el-form-item prop="confirmPassword" label="确认密码">
              <el-input
                  v-model="data.form.confirmPassword"
                  type="password"
                  placeholder="请确认新密码"
                  show-password
                  clearable
                  prefix-icon="Lock"
              >
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                  type="primary"
                  native-type="submit"
                  @click="change"
              >
                确认修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import {onMounted, reactive, ref} from "vue";
import {getCities, getDistricts, getProvinces} from "../../../api/address.js";
import {userApi} from "../../../api/user.js";
import {ElMessage} from "element-plus";
import {useAuthStore} from "../../../stores/auth.js";
import router from "../../../router/index.js";
import { uploadImage } from "../../../api/file.js";

const auth = useAuthStore()
const userData = ref({});
const previewImage = ref('');

const save = () => {
  formRef1.value.validate(async (valid) => {
    if (valid) {
        await userApi.updateUser(info.form)
        auth.setUser(info.form)
        ElMessage.success("用户信息更新成功")
    }
  });
}

const change = () => {
  formRef2.value.validate( async (valid) => {
    if (valid) {
      if (data.form.newPassword !== data.form.confirmPassword) {
        ElMessage.error("两次密码不相同")
        throw new Error("两次密码不相同");
      }

      const res = await userApi.changePassword(data.form)
      auth.clearAuthData()
      await router.push("/login")
      ElMessage.success("修改密码成功, 请重新登录")
    }
  });
}

// 头像上传处理
const handleAvatarChange = async (file) => {
  if (file && file.raw) {
    try {
      // 设置本地预览
      previewImage.value = URL.createObjectURL(file.raw);
      
      // 上传到服务器
      const response = await uploadImage(file.raw);
      
      // 上传成功后，设置表单的avatarUrl
      info.form.avatarUrl = response.data;
      
      // 清除预览图片，使用服务器图片
      setTimeout(() => {
        previewImage.value = '';
      }, 500);
    } catch (error) {
      ElMessage.error('头像上传失败');
      // 清除预览
      previewImage.value = '';
    }
  }
};

const activeName = ref('first');
const formRef1 = ref();
const formRef2 = ref();

const data = reactive({
  form: {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  },
  rules: {
    oldPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
    ],
    newPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { 
        validator: (rule, value, callback) => {
          const hasLetter = /[a-zA-Z]/.test(value);
          const hasNumber = /[0-9]/.test(value);
          const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
          
          if (!hasLetter || !hasNumber || !hasSymbol) {
            callback(new Error('密码必须包含字母、数字和符号'));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      { required: true, message: '请输入密码', trigger: 'blur' },
    ],
  }
});

const info = reactive({
  form: {
    id: null,
    name: '',
    phone: '',
    provinceId: null,
    cityId: null,
    districtId: null,
    avatarUrl: '',
  },
  rules: {
    name: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
    ],
    phone: [
      { required: true, message: '请输入电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    provinceId: [
      { required: true, message: '请选择省份', trigger: 'blur' },
    ],
    cityId: [
      { required: true, message: '请选择城市', trigger: 'blur' },
    ],
    districtId: [
      { required: true, message: '请选择区县', trigger: 'blur' },
    ],
  }
});

// 用于存储从 API 获取的列表数据
const provinceList = ref([]);
const cityList = ref([]);
const districtList = ref([]);

// 加载状态
const provinceLoading = ref(false);
const cityLoading = ref(false);
const districtLoading = ref(false);

// 初始化用户数据
const initUserData = async () => {
  try {
    const result = await userApi.getUserInfo();
    userData.value = result.data || {};
    
    // 更新表单数据
    info.form.id = userData.value.id;
    info.form.name = userData.value.name;
    info.form.phone = userData.value.phone;
    info.form.avatarUrl = userData.value.avatarUrl;
    
    // 先获取省份列表（如果尚未获取）
    if (provinceList.value.length === 0) {
      await fetchProvinces();
    }
    
    // 通过省份名称查找省份ID
    if (userData.value.province) {
      const province = provinceList.value.find(p => p.name === userData.value.province);
      if (province) {
        info.form.provinceId = province.id;
        // 获取城市列表
        await handleProvinceChange(province.id);
        
        // 通过城市名称查找城市ID
        if (userData.value.city && cityList.value.length > 0) {
          const city = cityList.value.find(c => c.name === userData.value.city);
          if (city) {
            info.form.cityId = city.id;
            // 获取区县列表
            await handleCityChange(city.id);
            
            // 通过区县名称查找区县ID
            if (userData.value.district && districtList.value.length > 0) {
              const district = districtList.value.find(d => d.name === userData.value.district);
              if (district) {
                info.form.districtId = district.id;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    ElMessage.error("获取用户信息失败：" + (error.message || "未知错误"));
  }
};

onMounted(async () => {
  await fetchProvinces(); // 组件挂载时获取省份列表
  await initUserData(); // 获取并初始化用户数据
});

// 获取省份列表
const fetchProvinces = async () => {
  provinceLoading.value = true;
  try {
    const response = await getProvinces();
    provinceList.value = response.data;
  } finally {
    provinceLoading.value = false;
  }
};

// 处理省份选择变化
const handleProvinceChange = async (provinceId) => {
  if (!provinceId) {
    // 清空下级数据和选择
    cityList.value = [];
    districtList.value = [];
    info.form.cityId = null;
    info.form.districtId = null;
    return;
  }

  // 获取城市列表
  cityLoading.value = true;
  try {
    const response = await getCities(provinceId);
    cityList.value = response.data;
  } finally {
    cityLoading.value = false;
  }
};

// 处理城市选择变化
const handleCityChange = async (cityId) => {
  if (!cityId) {
    // 清空下级数据和选择
    districtList.value = [];
    info.form.districtId = null;
    return;
  }

  // 获取区县列表
  districtLoading.value = true;
  try {
    const response = await getDistricts(cityId);
    districtList.value = response.data;
  } finally {
    districtLoading.value = false;
  }
};

// 处理区县选择变化
const handleDistrictChange = (districtId) => {
  if (!districtId) return;
};

</script>

<style scoped>
.ticket-entry-container {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.ticket-form {
  max-width: 800px;
  margin: 0 auto;
}

/* 头像区域样式 */
.avatar-container {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  margin-right: 20px;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.upload-button {
  flex: 1;
}

/* 首字母头像样式 */
:deep(.name-avatar) {
  background: #001529;
  color: #fff;
  font-size: 14px;
}

/* 表单项样式统一 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  transition: all 0.3s;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409EFF inset;
}

/* 确保 Select 组件的宽度 */
:deep(.el-select) {
  width: 100%;
}
</style>