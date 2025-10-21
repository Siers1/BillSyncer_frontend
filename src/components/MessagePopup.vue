<template>
  <!-- 消息按钮 -->
  <div class="message-button" @click="openDialog">
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" type="danger">
      <el-icon :size="20">
        <ChatDotRound />
      </el-icon>
    </el-badge>
  </div>

  <!-- 消息对话框 -->
  <el-dialog 
    v-model="dialogVisible" 
    title="邀请通知" 
    :width="'90%'"
    :style="{ maxWidth: '900px' }"
    :before-close="handleClose"
    class="message-dialog"
    center
  >
    <div class="message-container">
      <!-- 左侧消息列表 -->
      <div class="message-list-panel">
        <div class="panel-header">
          <span class="panel-title">消息列表</span>
          <el-button text @click="refreshInvitations" :loading="loading">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        
        <div class="message-list" v-loading="loading">
          <div v-if="invitations.length === 0" class="empty-message">
            <el-empty description="暂无邀请通知" :image-size="60" />
          </div>

          <div v-else class="invitation-list">
            <div
              v-for="invitation in invitations"
              :key="invitation.id"
              class="invitation-item"
              :class="{ 
                'active': selectedInvitation?.id === invitation.id,
                'unread': invitation.status === 0
              }"
              @click="selectInvitation(invitation)"
            >
              <div class="invitation-brief">
                <div class="invitation-title">
                  用户 {{ invitation.inviterId }} 的邀请
                </div>
                <div class="invitation-time">
                  {{ formatTime(invitation.createTime) }}
                </div>
              </div>
              <div class="invitation-status-badge">
                <el-badge 
                  v-if="invitation.status === 0" 
                  is-dot 
                  type="danger"
                />
                <el-tag 
                  v-else
                  :type="invitation.status === 1 ? 'success' : 'danger'" 
                  size="small"
                >
                  {{ invitation.status === 1 ? '已接受' : '已拒绝' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="message-detail-panel">
        <div v-if="selectedInvitation" class="invitation-detail">
          <div class="detail-header">
            <h3>邀请详情</h3>
          </div>
          
          <div class="detail-content">
            <div class="detail-item">
              <label>邀请者：</label>
              <span class="highlight">用户 {{ selectedInvitation.inviterId }}</span>
            </div>
            
            <div class="detail-item">
              <label>账单：</label>
              <span class="highlight">{{ selectedInvitation.billId }}</span>
            </div>
            
            <div class="detail-item">
              <label>邀请时间：</label>
              <span>{{ formatTime(selectedInvitation.createTime) }}</span>
            </div>
            
            <div class="detail-item">
              <label>状态：</label>
              <el-tag 
                :type="selectedInvitation.status === 0 ? 'warning' : selectedInvitation.status === 1 ? 'success' : 'danger'"
                size="small"
              >
                {{ 
                  selectedInvitation.status === 0 ? '待处理' : 
                  selectedInvitation.status === 1 ? '已接受' : '已拒绝' 
                }}
              </el-tag>
            </div>

            <div class="invitation-message">
              用户 <span class="highlight">{{ selectedInvitation.inviterId }}</span> 
              邀请你加入账单 <span class="highlight">{{ selectedInvitation.billId }}</span>，
              请选择是否接受此邀请。
            </div>
          </div>
          
          <div class="detail-actions" v-if="selectedInvitation.status === 0">
            <el-button 
              type="success" 
              @click="handleInvitationAction(selectedInvitation.id, 1)"
              :loading="actionLoading[selectedInvitation.id]"
            >
              接受邀请
            </el-button>
            <el-button 
              type="danger" 
              @click="handleInvitationAction(selectedInvitation.id, 2)"
              :loading="actionLoading[selectedInvitation.id]"
            >
              拒绝邀请
            </el-button>
          </div>
          
          <div class="detail-actions" v-else>
            <el-button disabled>
              {{ selectedInvitation.status === 1 ? '已接受邀请' : '已拒绝邀请' }}
            </el-button>
          </div>
        </div>
        
        <div v-else class="no-selection">
          <el-empty description="请选择一条消息查看详情" :image-size="80" />
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ChatDotRound, Refresh } from '@element-plus/icons-vue';
import { getInvitationList, handleInvitation, readNotification } from '@/api/invitation';
import { webSocketService } from '@/utils/websocket';
import type { InvitationDTO } from '@/dto/InvitationDTO';
import type { HandleInvitationDTO } from '@/dto/HandleInvitationDTO';

const dialogVisible = ref(false);
const loading = ref(false);
const invitations = ref<InvitationDTO[]>([]);
const selectedInvitation = ref<InvitationDTO | null>(null);
const actionLoading = ref<Record<number, boolean>>({});

// 从WebSocket服务获取未读数量
const unreadCount = computed(() => webSocketService.unreadCount.value);

const openDialog = async () => {
  dialogVisible.value = true;
  await loadInvitations();
  // 不自动选中第一个，让用户手动点击
};

const handleClose = () => {
  dialogVisible.value = false;
  selectedInvitation.value = null;
};

const loadInvitations = async () => {
  loading.value = true;
  const data = await getInvitationList();
  // 按创建时间降序排序，最新的消息在最上面
  invitations.value = data.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  loading.value = false;
};

const refreshInvitations = async () => {
  await loadInvitations();
  // 刷新后同时更新未读数量
  await webSocketService.refreshUnreadCount();
};

const selectInvitation = async (invitation: InvitationDTO) => {
  selectedInvitation.value = invitation;
  await readNotification(invitation.id);
  
  // 调用完已读接口后，刷新未读数量
  await webSocketService.refreshUnreadCount();
};

const handleInvitationAction = async (invitationId: number, optionCode: number) => {
  actionLoading.value[invitationId] = true;
  
  const handleDto: HandleInvitationDTO = {
    invitationId,
    optionCode
  };
  
  await handleInvitation(handleDto);
  
  // 处理成功后刷新列表和未读数量
  await refreshInvitations();
  
  actionLoading.value[invitationId] = false;
};

const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于1小时显示分钟
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
  }
  
  // 小于24小时显示小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 超过24小时显示日期
  return date.toLocaleDateString();
};

// 监听WebSocket消息
onMounted(() => {
  const messageListener = (message: string) => {
    console.log('MessagePopup: 收到WebSocket消息', message);
    // 收到消息时如果对话框打开，刷新邀请列表
    if (dialogVisible.value) {
      console.log('MessagePopup: 对话框已打开，刷新邀请列表');
      loadInvitations();
    } else {
      console.log('MessagePopup: 对话框未打开，未读数量应该已自动更新');
    }
  };
  
  webSocketService.addMessageListener(messageListener);
});
</script>

<style scoped>
.message-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s;
  color: #606266;
  position: relative;
}

.message-button:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

/* 确保badge正确定位 */
.message-button :deep(.el-badge) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-button :deep(.el-badge__content) {
  top: -8px;
  right: -8px;
  transform: none;
}

.message-container {
  display: flex;
  height: 60vh;
  max-height: 600px;
  min-height: 400px;
  gap: 1px;
  background-color: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

/* 左侧消息列表面板 */
.message-list-panel {
  width: 35%;
  min-width: 280px;
  max-width: 350px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f7fa;
}

.panel-title {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.invitation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invitation-item {
  padding: 12px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invitation-item:hover {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.invitation-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.invitation-item.unread {
  border-left: 4px solid #f56c6c;
}

.invitation-brief {
  flex: 1;
  min-width: 0;
}

.invitation-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  font-weight: 500;
}

.invitation-time {
  font-size: 12px;
  color: #909399;
}

.invitation-status-badge {
  margin-left: 8px;
}

/* 右侧详情面板 */
.message-detail-panel {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.invitation-detail {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.detail-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.detail-content {
  flex: 1;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.detail-item label {
  width: 80px;
  font-weight: 500;
  color: #606266;
  margin-right: 12px;
  flex-shrink: 0;
}

.detail-item .highlight {
  color: #409eff;
  font-weight: 500;
}

.invitation-message {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
  line-height: 1.6;
  color: #606266;
}

.invitation-message .highlight {
  color: #409eff;
  font-weight: 500;
}

.detail-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #fafafa;
}

/* 自定义滚动条 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .message-container {
    flex-direction: column;
    height: 70vh;
  }
  
  .message-list-panel {
    width: 100%;
    min-width: unset;
    max-width: unset;
    max-height: 200px;
  }
  
  .message-detail-panel {
    min-height: 300px;
  }
}
</style>

<style>
/* 全局样式 - 对话框样式 */
.message-dialog .el-dialog {
  margin: 5vh auto !important;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.message-dialog .el-dialog__body {
  padding: 0 !important;
  flex: 1;
  overflow: hidden;
}

.message-dialog .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .message-dialog .el-dialog {
    width: 95% !important;
    margin: 2.5vh auto !important;
    max-height: 95vh;
  }
}
</style>
