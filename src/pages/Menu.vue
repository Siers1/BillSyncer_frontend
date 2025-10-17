<template>
  <el-container class="layout-container">
    <!-- 左侧菜单栏 -->
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar" :class="{ 'collapsed': isCollapsed }">
      <!-- 标题栏 -->
      <div class="sidebar-header">
        <img src="@/assets/logo.svg" alt="Logo" class="logo" />
        <h2 v-show="!isCollapsed">BillSyncer</h2>
      </div>
      
      <!-- 菜单项 -->
      <div class="sidebar-menu">
        <div class="menu-wrapper">
         <el-menu
           :default-active="route.path"
           router
           class="menu"
           :collapse="isCollapsed"
         >
          <el-menu-item index="/home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="/bill">
            <template #title>
              <el-icon><Notebook /></el-icon>
              <span>账本管理</span>
            </template>
            <el-menu-item index="/bill/list">
              <el-icon><List /></el-icon>
              <span>账本列表</span>
            </el-menu-item>
            <el-menu-item index="/bill/record">
              <el-icon><Document /></el-icon>
              <span>消费记录</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
        
        </div>
      </div>

      
      
       <!-- 用户信息区域 -->
       <el-dropdown 
         trigger="click" 
         @command="handleUserCommand" 
         @visible-change="handleDropdownVisibleChange"
         class="user-info-area"
       >
         <div class="user-info-content">
           <el-avatar :src="userStore.user?.avatar" :size="32">
             <el-icon><User /></el-icon>
           </el-avatar>
           <div v-show="!isCollapsed" class="user-details">
             <div class="username">{{ userStore.user?.username }}</div>
             <div class="account">{{ userStore.user?.account }}</div>
           </div>
           <el-icon v-show="!isCollapsed" class="dropdown-icon" :class="{ 'rotated': isDropdownOpen }">
             <ArrowUp />
           </el-icon>
         </div>
         <template #dropdown>
           <el-dropdown-menu class="user-dropdown-menu">
            <el-dropdown-item command="profile" class="dropdown-item">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </el-dropdown-item>
             <el-dropdown-item command="logout" class="dropdown-item">
               <el-icon><SwitchButton /></el-icon>
               <span>退出登录</span>
             </el-dropdown-item>
           </el-dropdown-menu>
         </template>
       </el-dropdown>
    </el-aside>
    
    <!-- 右侧内容区域 -->
    <el-container>
      <!-- 导航条 -->
      <el-header class="header-nav">
        <div class="nav-content">
          <div class="nav-left">
            <div class="collapse-btn-container" @click="toggleSidebar" :title="isCollapsed ? '展开菜单' : '收缩菜单'">
              <el-icon v-if="!isCollapsed">
                <Fold/>
              </el-icon>
              <el-icon v-else>
                <Expand/>
              </el-icon>
            </div>
            <span class="page-title">{{ route.meta.title }}</span>
          </div>
          <div class="nav-right">
            <MessagePopup />
          </div>
        </div>
      </el-header>
      
      <!-- 页面内容 -->
      <el-main class="content-area">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getUserDetails } from '@/api/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { webSocketService } from '@/utils/websocket';
import MessagePopup from '@/components/MessagePopup.vue';
import {
    House,
    User,
    SwitchButton,
    Fold,
    Expand, 
    ArrowUp,
    Notebook,
    List,
    Document,
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useAuthStore();

// 下拉菜单状态
const isDropdownOpen = ref(false);

// 菜单栏收缩状态
const isCollapsed = ref(false);



// 获取用户详细信息
const fetchUserDetails = async () => {
    const userData = await getUserDetails();
    userStore.setUser(userData);
};

// 处理下拉菜单显示/隐藏
const handleDropdownVisibleChange = (visible: boolean) => {
  isDropdownOpen.value = visible;
};

// 切换菜单栏收缩状态
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 处理用户下拉菜单命令
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      // 跳转到个人信息页面
      router.push('/info');
      break;
    case 'logout':
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
        
        // 断开WebSocket连接
        webSocketService.disconnect();
        
        userStore.logout();
        ElMessage.success('退出登录成功');
        router.push('/login');
      break;
  }
};

// WebSocket消息处理器
const handleWebSocketMessage = async (message: string) => {
  if (message === 'SINGLE_SIGN_ON_LOGOUT') {
    try {
      await ElMessageBox.confirm(
        '您的账号在其他设备登录，当前会话将被终止。',
        '账号安全提醒',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          showCancelButton: false, // 不显示取消按钮，因为这是强制退出
          closeOnClickModal: false, // 不允许点击遮罩关闭
          closeOnPressEscape: false, // 不允许按ESC关闭
          showClose: false, // 不显示关闭按钮
        }
      );
    } catch (error) {
      // 即使用户没有点击确定，也要强制退出
      console.log('用户被强制退出登录');
    } finally {
      // 无论如何都要跳转到登录页面
      router.push('/login');
    }
  }
};

// 组件挂载时获取用户信息并初始化WebSocket
onMounted(async () => {
    await fetchUserDetails();
    
    // 用户信息获取完成后初始化WebSocket连接
    if (userStore.accessToken) {
        console.log('Menu: 初始化WebSocket连接');
        webSocketService.init();
        
        // 添加WebSocket消息监听器
        webSocketService.addMessageListener(handleWebSocketMessage);
    }
});

// 组件卸载时断开WebSocket连接
onBeforeUnmount(() => {
    // 移除WebSocket消息监听器
    webSocketService.removeMessageListener(handleWebSocketMessage);
    webSocketService.disconnect();
});
</script>

<style scoped>
.layout-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
}

/* 左侧菜单栏 */
.sidebar {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s ease;
  overflow-x: hidden;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 0 16px;
}

.sidebar-header .logo {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  transition: margin 0.3s ease;
}

.sidebar.collapsed .sidebar-header .logo {
  margin-right: 0;
}

.sidebar-header h2 {
  color: #303133;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  transition: opacity 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
}

/* 禁用菜单容器横向滚动 */
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s ease;
}

/* 收缩时隐藏文字，仅保留图标 */
.sidebar.collapsed .menu .el-menu-item span {
  width: 0;
  opacity: 0;
  margin-left: 0;
  overflow: hidden;
  transition: width 0.3s ease, opacity 0.2s ease;
}

/* 图标水平居中 */
.sidebar.collapsed .menu .el-menu-item {
  justify-content: center;
}

/* 修正 Element Plus 内部 padding 导致的抖动 */
.sidebar.collapsed .menu .el-menu-item .el-icon {
  margin: 0;
}

.menu {
  border: none;
  background-color: transparent;
  transition: width 0.3s ease;
}

.menu .el-menu-item {
  color: #606266;
  border-bottom: none;
  position: relative;
  transition: all 0.3s ease;
}

.menu .el-sub-menu .el-sub-menu__title {
  color: #606266;
  border-bottom: none;
  transition: all 0.3s ease;
  position: relative;
}


.menu .el-menu-item:hover {
  background-color: #f5f7fa !important;
  color: #409eff;
}

.menu .el-menu-item.is-active {
  background-color: #f5f7fa !important;
  color: #409eff !important;
}

/* 使用右侧边框作为活动指示条，避免在折叠/展开时位置跳变 */

.menu .el-menu-item {
  position: relative;
}

/* 菜单包装器 */
.menu-wrapper {
  position: relative;
  width: 100%;
}

/* 子菜单样式 */
.menu .el-sub-menu {
  background-color: transparent;
}

.menu .el-sub-menu .el-sub-menu__title:hover {
  background-color: #f5f7fa !important;
  color: #409eff;
}

.menu .el-sub-menu.is-active .el-sub-menu__title {
  color: #409eff !important;
}

.menu .el-sub-menu .el-menu-item {
  background-color: #fafafa;
}

.menu .el-sub-menu .el-menu-item:hover {
  background-color: #f0f0f0 !important;
}

.menu .el-sub-menu .el-menu-item.is-active {
  background-color: #ecf5ff !important;
  color: #409eff !important;
}

/* 收缩状态下子菜单样式 */
.sidebar.collapsed .menu .el-sub-menu .el-sub-menu__title span {
  width: 0;
  opacity: 0;
  margin-left: 0;
  overflow: hidden;
  transition: width 0.3s ease, opacity 0.2s ease;
}

.sidebar.collapsed .menu .el-sub-menu .el-sub-menu__title {
  justify-content: center;
}

.sidebar.collapsed .menu .el-sub-menu .el-sub-menu__title .el-icon {
  margin: 0;
}

/* 用户信息区域 */
.user-info-area {
  width: 100%;
  height: 70px;
  border-top: 1px solid #e4e7ed;
  background-color: #f5f7fa;
  display: block;
}

.user-info-content {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  min-width: 0;
}

/* 收缩状态下的用户信息样式 */
.sidebar.collapsed .user-info-content {
  justify-content: center;
  padding: 15px 16px;
}

.user-info-content:hover {
  background-color: #ecf5ff;
}

.user-details {
  flex: 1;
  margin-left: 12px;
  color: #303133;
  transition: opacity 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
}

.username {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
}

.account {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.dropdown-icon {
  color: #909399;
  font-size: 14px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

/* 导航条 */
.header-nav {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 !important;
  height: 60px !important;
  line-height: 60px !important;
  box-sizing: border-box;
}

.nav-content {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-sizing: border-box;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 0;
}

.collapse-btn-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  margin-left: -8px;
  cursor: pointer;
  color: #495057;
  font-size: 25px;
}

.collapse-btn-container:hover {
  color: #409eff;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.nav-right {
  display: flex;
  align-items: center;
}


/* 内容区域 */
.content-area {
  background-color: #f5f5f5;
  padding: 20px;
}

/* 动态活动指示条（位于菜单内容层之上，靠右显示） */
.active-indicator {
  position: absolute;
  right: 0;
  width: 3px;
  background-color: #409eff;
  transition: top 0.3s ease, height 0.3s ease, opacity 0.2s ease;
  pointer-events: none;
}

/* 用户下拉菜单样式 */
.user-dropdown-menu {
  min-width: 180px;
}

.dropdown-item {
  padding: 12px 16px !important;
  font-size: 14px;
  line-height: 1.5;
}

.dropdown-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.dropdown-item span {
  font-size: 14px;
}
</style>