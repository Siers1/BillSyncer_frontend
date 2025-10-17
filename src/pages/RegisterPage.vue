<template>
  <div class="register-container">
    <div class="register-card">
      <!-- 左侧插图区域 -->
      <div class="illustration-section">
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
        <div class="welcome-content">
          <div class="welcome-banner">
            <h2 class="welcome-text">加入我们</h2>
            <h1 class="app-name">共享账本</h1>
          </div>
          <div class="illustration-icons">
            <div class="icon-item">🚀</div>
            <div class="icon-item">📝</div>
            <div class="icon-item">🎯</div>
          </div>
        </div>
      </div>
      
      <!-- 右侧注册表单 -->
      <div class="form-section">
        <div class="form-content">
          <h2 class="form-title">注册</h2>
          <p class="form-subtitle">创建你的账户开始使用</p>
          
           <el-form ref="formRef" :model="form" :rules="rules" class="register-form">
             <el-form-item prop="account">
               <el-input 
                 v-model="form.account" 
                 placeholder="用户名" 
                 size="large"
                 :prefix-icon="User"
                 @keyup.enter="handleRegister"
               />
             </el-form-item>
             
             <el-form-item prop="password">
               <el-input 
                 v-model="form.password" 
                 type="password" 
                 placeholder="密码" 
                 size="large"
                 :prefix-icon="Lock"
                 show-password
                 @keyup.enter="handleRegister"
               />
             </el-form-item>
            
            <el-button 
              type="primary" 
              class="register-btn" 
              :loading="loading" 
              size="large"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form>
          
          <div class="form-footer">
            <span>已有账户？</span>
            <router-link to="/login" class="login-link">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'
import type { LoginDTO } from '@/dto/LoginDTO'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive<LoginDTO>({
  account: '',
  password: ''
})

const rules = {
  account: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

 const handleRegister = async () => {
   if (!await formRef.value.validate()) return
   
   loading.value = true
   try {
     await register(form)
     router.push('/login')
   } finally {
     loading.value = false
   }
 }
</script>

<style scoped>
 .register-container {
   position: fixed;
   top: 0;
   left: 0;
   width: 100vw;
   height: 100vh;
   margin: 0;
   padding: 0;
   display: flex;
   align-items: center;
   justify-content: center;
   background: linear-gradient(135deg, #10b981 0%, #ffffff 100%);
   overflow: hidden;
 }

 .register-card {
   width: 100%;
   max-width: 900px;
   height: 600px;
   background: white;
   border-radius: 24px;
   box-shadow: 0 20px 60px rgba(16, 185, 129, 0.15);
   display: grid;
   grid-template-columns: 1fr 1fr;
   overflow: hidden;
   animation: slideUp 0.8s ease-out;
   position: relative;
   z-index: 10;
   margin: 20px;
 }

/* 左侧插图区域 */
.illustration-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.shape {
  position: absolute;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  opacity: 0.1;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 15%;
  right: 10%;
  animation: float 6s ease-in-out infinite;
}

.shape-2 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 15%;
  animation: float 8s ease-in-out infinite reverse;
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  left: 60%;
  animation: float 7s ease-in-out infinite;
}

.welcome-content {
  position: relative;
  z-index: 2;
  text-align: center;
  animation: slideInLeft 0.8s ease-out;
}

.welcome-banner {
  margin-bottom: 40px;
}

.welcome-text {
  font-size: 24px;
  color: #10b981;
  margin: 0 0 8px 0;
  font-weight: 400;
  animation: fadeIn 0.8s ease-out 0.2s both;
}

.app-name {
  font-size: 36px;
  color: #1e293b;
  margin: 0;
  font-weight: 700;
  animation: fadeIn 0.8s ease-out 0.4s both;
}

.illustration-icons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

 .icon-item {
   width: 60px;
   height: 60px;
   display: flex;
   align-items: center;
   justify-content: center;
   font-size: 24px;
   animation: float 3s ease-in-out infinite;
 }

.icon-item:nth-child(1) { animation-delay: 0s; }
.icon-item:nth-child(2) { animation-delay: 0.5s; }
.icon-item:nth-child(3) { animation-delay: 1s; }

/* 右侧表单区域 */
.form-section {
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-content {
  width: 100%;
  max-width: 320px;
  animation: slideInRight 0.8s ease-out;
}

.form-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  text-align: center;
  animation: fadeIn 0.8s ease-out 0.3s both;
}

.form-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0 0 40px 0;
  text-align: center;
  animation: fadeIn 0.8s ease-out 0.4s both;
}

.register-form {
  animation: slideInUp 0.8s ease-out 0.5s both;
}

.register-form .el-form-item {
  margin-bottom: 24px;
}

.register-form .el-input {
  height: 48px;
  border-radius: 12px;
}

.register-form .el-input__wrapper {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: none;
  transition: all 0.3s ease;
}

.register-form .el-input__wrapper:hover {
  border-color: #10b981;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.register-form .el-input__wrapper.is-focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.register-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.form-footer {
  text-align: center;
  margin-top: 32px;
  color: #64748b;
  font-size: 14px;
  animation: fadeIn 0.8s ease-out 0.7s both;
}

.login-link {
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: all 0.3s ease;
}

.login-link:hover {
  color: #047857;
  text-decoration: underline;
}

/* 动画关键帧 */
@keyframes float {
  0%, 100% { 
    transform: translateY(0) rotate(0deg); 
  }
  50% { 
    transform: translateY(-10px) rotate(180deg); 
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-card {
    grid-template-columns: 1fr;
    height: auto;
    max-width: 400px;
    margin: 10px;
  }
  
  .illustration-section {
    padding: 30px 20px;
  }
  
  .form-section {
    padding: 40px 30px;
  }
  
  .app-name {
    font-size: 28px;
  }
  
  .form-title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .register-card {
    margin: 5px;
  }
  
  .form-section {
    padding: 30px 20px;
  }
  
  .form-content {
    max-width: 100%;
  }
}
</style>
