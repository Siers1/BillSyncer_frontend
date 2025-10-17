<template>
  <div class="ticket-entry-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      <el-tabs v-model="activeName">
        <el-tab-pane label="基本信息" name="first">
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
            <el-form-item label="头像">
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
                    :src="info.form.avatar" 
                    v-else
                  >
                    <el-icon><User /></el-icon>
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

            <el-form-item prop="username" label="用户名">
              <el-input
                  v-model="info.form.username"
                  placeholder="请输入用户名"
                  prefix-icon="User"
              >
              </el-input>
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
                  @click="changePassword"
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

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import router from "@/router/index";
import { uploadImage } from "@/api/file";
import { getUserDetails, updateUser, changePassword as changeUserPassword } from "@/api/user";
import type { UserDTO } from "@/dto/UserDTO";
import type { PasswordDTO } from "@/dto/PasswordDTO";
import { User } from '@element-plus/icons-vue';

const auth = useAuthStore();
const userData = ref<UserDTO | null>(null);
const previewImage = ref('');

const save = () => {
  formRef1.value.validate(async (valid: boolean) => {
    if (valid) {
        // 确保有用户ID
        if (!info.form.id) {
          return;
        }
        
        // 只传递用户ID、用户名和头像
        const updateData: UserDTO = {
          id: info.form.id,
          username: info.form.username,
          avatar: info.form.avatar
        };
        await updateUser(updateData);
        
        // 更新本地存储的用户信息
        if (userData.value) {
          userData.value.username = info.form.username;
          userData.value.avatar = info.form.avatar;
        }
        auth.setUser({...auth.user, username: info.form.username, avatar: info.form.avatar});
    }
  });
};

const changePassword = () => {
  formRef2.value.validate(async (valid: boolean) => {
    if (valid) {
      if (data.form.newPassword !== data.form.confirmPassword) {
        return;
      }

      const passwordData: PasswordDTO = {
        oldPassword: data.form.oldPassword,
        newPassword: data.form.newPassword
      };
      
      await changeUserPassword(passwordData);
      auth.logout();
      await router.push("/login");
    }
  });
};

// 头像上传处理
const handleAvatarChange = async (file: any) => {
  if (file && file.raw) {
    try {
      // 设置本地预览
      previewImage.value = URL.createObjectURL(file.raw);
      
      // 上传到服务器
      const response = await uploadImage(file.raw);
      
      // 上传成功后，设置表单的avatar
      info.form.avatar = response.data;
      
      // 自动保存用户信息
      save();
      
      // 清除预览图片，使用服务器图片
      setTimeout(() => {
        previewImage.value = '';
      }, 500);
    } catch (error) {
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
      { required: true, message: '请输入原密码', trigger: 'blur' },
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      { 
        validator: (rule: any, value: string, callback: any) => {
          if (value !== data.form.newPassword) {
            callback(new Error('两次输入密码不一致'));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ],
  }
});

const info = reactive({
  form: {
    id: null as number | null,
    username: '',
    avatar: '',
  },
  rules: {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '用户名长度在2到20个字符', trigger: 'blur' }
    ],
  }
});

// 初始化用户数据
const initUserData = () => {
  // 直接从authStore获取用户信息
  userData.value = auth.user;
  
  // 更新表单数据
  if (userData.value) {
    info.form.id = userData.value.id || 0;
    info.form.username = userData.value.username || '';
    info.form.avatar = userData.value.avatar || '';
  }
};

onMounted(() => {
  initUserData();
});

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

/* 默认用户图标样式 */
.avatar-wrapper .el-avatar .el-icon {
  font-size: 32px;
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