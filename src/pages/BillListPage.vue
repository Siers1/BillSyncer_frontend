<template>
    <div class="bill-list-container">
        <!-- 页面标题和操作按钮 -->
        <div class="page-header">
            <div class="header-left">
                <h2 class="page-title">全部账本</h2>
            </div>
            <div class="header-right">
                <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
                    添加账本
                </el-button>
                <el-button @click="refreshBillList" :icon="Refresh" :loading="loading">
                    刷新
                </el-button>
            </div>
        </div>

        <!-- 账本列表表格 -->
        <div class="table-container">
            <div class="table-wrapper">
                <el-table
                    :data="billList"
                    v-loading="loading"
                    style="width: 100%"
                    class="bill-table"
                    stripe
                    border
                    :max-height="tableMaxHeight"
                >
                <el-table-column prop="id" label="ID" align="center" />
                <el-table-column prop="billName" label="账本名称" align="center" />
                <el-table-column label="创建时间" align="center">
                    <template #default="scope">
                        {{ formatDateTime(scope.row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="showBillDetail(scope.row)" link>
                            详情
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDeleteBill(scope.row)" link>
                            删除
                        </el-button>
                    </template>
                </el-table-column>
                </el-table>
            </div>

            <!-- 分页组件 -->
            <div class="pagination-container">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="totalRow"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>
        </div>

        <!-- 创建账本对话框 -->
        <el-dialog
            v-model="showCreateDialog"
            title="创建新账本"
            width="500px"
            :close-on-click-modal="false"
        >
            <el-form
                :model="createForm"
                :rules="createRules"
                ref="createFormRef"
                label-width="100px"
            >
                <el-form-item label="账本名称" prop="billName">
                    <el-input
                        v-model="createForm.billName"
                        placeholder="请输入账本名称"
                        maxlength="50"
                        show-word-limit
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showCreateDialog = false">取消</el-button>
                    <el-button type="primary" @click="handleCreateBill" :loading="createLoading">
                        创建
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 账本详情对话框 -->
        <el-dialog
            v-model="showDetailDialog"
            title="账本详情"
            width="600px"
            :close-on-click-modal="false"
        >
            <div class="detail-content">
                <!-- 账本名称和保存按钮 -->
                <div class="bill-name-section">
                    <div class="name-input-group">
                        <el-form :model="detailForm" :rules="detailRules" ref="detailFormRef" class="name-form">
                            <el-form-item label="账本名称" prop="billName" class="name-form-item" required>
                                <el-input
                                    v-model="detailForm.billName"
                                    placeholder="请输入账本名称"
                                    maxlength="50"
                                    show-word-limit
                                    class="name-input"
                                />
                            </el-form-item>
                        </el-form>
                        <el-button type="primary" @click="handleUpdateBill" :loading="updateLoading" class="save-btn">
                            保存
                        </el-button>
                    </div>
                </div>

                <!-- 用户列表 -->
                <div class="users-section">
                    <div class="users-header">
                        <h4 class="section-title">账本用户</h4>
                        <el-button type="primary" size="small" @click="showInviteDialog = true" :icon="User">
                            邀请用户
                        </el-button>
                    </div>
                    <div v-loading="usersLoading" class="users-list">
                        <div v-if="billUsers.length === 0" class="empty-users">
                            暂无用户
                        </div>
                        <div v-else>
                            <div v-for="user in billUsers" :key="user.id" class="user-item">
                                <div class="user-left-section">
                                    <div class="user-info">
                                        <div class="user-avatar">
                                            <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
                                            <div v-else class="default-avatar">{{ user.username?.charAt(0)?.toUpperCase() }}</div>
                                        </div>
                                        <div class="user-details">
                                            <div class="user-name">{{ user.username }}</div>
                                            <div class="user-account">{{ user.account }}</div>
                                        </div>
                                    </div>
                                    <span class="user-role" :class="getRoleClass(user.roleId)">
                                        {{ getRoleText(user.roleId) }}
                                    </span>
                                </div>
                                <div class="user-actions">
                                    <!-- 成员显示设为管理员按钮 -->
                                    <el-button 
                                        v-if="user.roleId === 2"
                                        type="success" 
                                        size="small" 
                                        @click="handleAddManager(user)"
                                        :loading="managingUsers.has(user.id || 0)"
                                        link
                                    >
                                        设为管理员
                                    </el-button>
                                    <!-- 管理员显示移除管理员按钮 -->
                                    <el-button 
                                        v-if="user.roleId === 1"
                                        type="warning" 
                                        size="small" 
                                        @click="handleRemoveManager(user)"
                                        :loading="managingUsers.has(user.id || 0)"
                                        link
                                    >
                                        移除管理员
                                    </el-button>
                                <el-button 
                                    type="danger" 
                                    size="small" 
                                    @click="deleteUser(user)"
                                    :loading="deletingUsers.has(user.id || 0)"
                                    link
                                >
                                    删除
                                </el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 邀请用户对话框 -->
        <el-dialog
            v-model="showInviteDialog"
            title="邀请用户"
            width="500px"
            :close-on-click-modal="false"
        >
            <div class="invite-content">
                <!-- 搜索用户 -->
                <div class="search-section">
                    <div class="search-input-group">
                        <el-input
                            v-model="searchAccount"
                            placeholder="请输入用户账号"
                            @keyup.enter="handleSearchUser"
                            clearable
                        />
                        <el-button type="primary" @click="handleSearchUser" :loading="searchLoading">
                            搜索
                        </el-button>
                    </div>
                </div>

                <!-- 搜索结果 -->
                <div class="search-results" v-if="searchResults.length > 0">
                    <h5 class="results-title">搜索结果</h5>
                    <div class="results-list">
                        <div v-for="user in searchResults" :key="user.id" class="result-item">
                            <div class="user-info">
                                <div class="user-avatar">
                                    <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
                                    <div v-else class="default-avatar">{{ user.username?.charAt(0)?.toUpperCase() }}</div>
                                </div>
                                <div class="user-details">
                                    <div class="user-name">{{ user.username }}</div>
                                    <div class="user-account">{{ user.account }}</div>
                                </div>
                            </div>
                            <el-button 
                                type="primary" 
                                size="small" 
                                @click="handleSendInvitation(user)"
                                :loading="invitingUsers.has(user.id || 0)"
                            >
                                邀请
                            </el-button>
                        </div>
                    </div>
                </div>

                <!-- 无搜索结果 -->
                <div v-else-if="searchAccount && !searchLoading" class="no-results">
                    暂无搜索结果
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, reactive, computed, nextTick } from 'vue';
    import { ElMessageBox, type FormInstance } from 'element-plus';
    import { Plus, Refresh, User } from '@element-plus/icons-vue';
    import { getBillList, createBill, updateBill, getBillUsers, deleteBillUser, deleteBill, addManager, deleteManager } from '@/api/bill';
    import { searchUser } from '@/api/user';
    import { sendInvitation } from '@/api/invitation';
    import type { BillDTO } from '@/dto/BillDTO';
    import type { PageParam } from '@/dto/PageParam';
    import type { UpdateBillDTO } from '@/dto/UpdateBillDTO';
    import type { UserDTO } from '@/dto/UserDTO';
    import type { SendInvitationRequest } from '@/dto/SendInvitationRequest';
    import { formatDateTime } from '@/utils/DateUtil';
    import { useAuthStore } from '@/stores/authStore';

    // 响应式数据
    const billList = ref<BillDTO[]>([]);
    const loading = ref(false);
    const createLoading = ref(false);
    const updateLoading = ref(false);
    const usersLoading = ref(false);
    const showCreateDialog = ref(false);
    const showDetailDialog = ref(false);
    const showInviteDialog = ref(false);
    const billUsers = ref<UserDTO[]>([]);
    const deletingUsers = ref(new Set<number>());
    const managingUsers = ref(new Set<number>());
    
    // 邀请相关数据
    const searchAccount = ref('');
    const searchResults = ref<UserDTO[]>([]);
    const searchLoading = ref(false);
    const invitingUsers = ref(new Set<number>());
    
    // 获取认证store
    const authStore = useAuthStore();

    // 计算表格最大高度
    const tableMaxHeight = computed(() => {
        // 考虑导航栏(60px) + 页面内边距(40px) + 页面头部(约80px) + 分页器(约60px) + 表格容器内边距(48px)
        return 'calc(100vh - 288px)';
    });

    // 分页相关
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalRow = ref(0);

    // 创建表单
    const createForm = reactive({
        billName: '',
    });

    // 详情表单
    const detailForm = reactive({
        billId: 0,
        billName: '',
    });

    const createFormRef = ref<FormInstance>();
    const detailFormRef = ref<FormInstance>();

    // 表单验证规则
    const createRules = {
        billName: [{ required: true, message: '请输入账本名称', trigger: 'blur' }],
    };

    const detailRules = {
        billName: [{ required: true, message: '请输入账本名称', trigger: 'blur' }],
    };

    // 获取账本列表
    const fetchBillList = async () => {
        loading.value = true;
        try {
            const params: PageParam<BillDTO> = {
                pageNum: currentPage.value,
                pageSize: pageSize.value,
                params: {},
            };

            const response = await getBillList(params);
            billList.value = response.records;
            totalRow.value = response.totalRow;
        } finally {
            loading.value = false;
        }
    };

    // 刷新列表
    const refreshBillList = () => {
        fetchBillList();
    };

    // 分页大小改变
    const handleSizeChange = (val: number) => {
        pageSize.value = val;
        currentPage.value = 1;
        fetchBillList();
    };

    // 当前页改变
    const handleCurrentChange = (val: number) => {
        currentPage.value = val;
        fetchBillList();
    };

    // 创建账本
    const handleCreateBill = async () => {
        if (!createFormRef.value) return;

        await createFormRef.value.validate(async (valid) => {
            if (valid) {
                createLoading.value = true;
                try {
                    await createBill(createForm.billName);
                    showCreateDialog.value = false;
                    createForm.billName = '';
                    fetchBillList();
                } finally {
                    createLoading.value = false;
                }
            }
        });
    };

    // 显示账本详情
    const showBillDetail = async (bill: BillDTO) => {
        detailForm.billId = bill.id || 0;
        detailForm.billName = bill.billName || '';
        showDetailDialog.value = true;
        await fetchBillUsers(bill.id || 0);
    };

    // 获取账本用户列表
    const fetchBillUsers = async (billId: number) => {
        usersLoading.value = true;
        try {
            billUsers.value = await getBillUsers(billId);
        } catch (error) {
            console.error('获取用户列表失败:', error);
            billUsers.value = [];
        } finally {
            usersLoading.value = false;
        }
    };

    // 处理更新账本
    const handleUpdateBill = async () => {
        if (!detailFormRef.value) return;

        await detailFormRef.value.validate(async (valid) => {
            if (valid) {
                updateLoading.value = true;
                try {
                    const updateBillDTO: UpdateBillDTO = {
                        billId: detailForm.billId,
                        billName: detailForm.billName,
                    };
                    await updateBill(updateBillDTO);
                    fetchBillList();
                } finally {
                    updateLoading.value = false;
                }
            }
        });
    };

    // 删除用户
    const deleteUser = async (user: UserDTO) => {
        if (!user.id) {
            return;
        }

        await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '确认删除', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });

        const userId = user.id;
        deletingUsers.value.add(userId);
        try {
            await deleteBillUser(detailForm.billId, userId);
            await fetchBillUsers(detailForm.billId);
        } finally {
            deletingUsers.value.delete(userId);
        }
    };

    // 获取角色文本
    const getRoleText = (roleId?: number): string => {
        switch (roleId) {
            case 0:
                return '创建者';
            case 1:
                return '管理员';
            case 2:
                return '成员';
            default:
                return '未知';
        }
    };

    // 获取角色样式类
    const getRoleClass = (roleId?: number): string => {
        switch (roleId) {
            case 0:
                return 'role-creator';
            case 1:
                return 'role-admin';
            case 2:
                return 'role-member';
            default:
                return 'role-unknown';
        }
    };

    // 删除账本
    const handleDeleteBill = async (bill: BillDTO) => {
        await ElMessageBox.confirm(`确定要删除账本 "${bill.billName}" 吗？`, '确认删除', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });

        await deleteBill(bill.id || 0);
        fetchBillList();
    };

    // 搜索用户
    const handleSearchUser = async () => {
        if (!searchAccount.value.trim()) {
            return;
        }
        
        searchLoading.value = true;
        try {
            searchResults.value = await searchUser(searchAccount.value.trim());
        } catch (error) {
            console.error('搜索用户失败:', error);
            searchResults.value = [];
        } finally {
            searchLoading.value = false;
        }
    };

    // 发送邀请
    const handleSendInvitation = async (user: UserDTO) => {
        if (!user.id || !authStore.user?.id) {
            return;
        }

        const userId = user.id;
        const currentUserId = authStore.user.id;
        
        invitingUsers.value.add(userId);
        try {
            const invitationRequest: SendInvitationRequest = {
                billId: detailForm.billId,
                inviterId: currentUserId,
                inviteeId: userId,
            };
            
            await sendInvitation(invitationRequest);
            // 移除已邀请的用户
            searchResults.value = searchResults.value.filter(u => u.id !== userId);
        } catch (error) {
            console.error('发送邀请失败:', error);
        } finally {
            invitingUsers.value.delete(userId);
        }
    };

    // 设为管理员
    const handleAddManager = async (user: UserDTO) => {
        if (!user.id) {
            return;
        }

        await ElMessageBox.confirm(`确定要将用户 "${user.username}" 设为管理员吗？`, '确认设置', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });

        const userId = user.id;
        managingUsers.value.add(userId);
        try {
            await addManager(detailForm.billId, userId);
            await fetchBillUsers(detailForm.billId);
        } catch (error) {
            console.error('设置管理员失败:', error);
        } finally {
            managingUsers.value.delete(userId);
        }
    };

    // 移除管理员
    const handleRemoveManager = async (user: UserDTO) => {
        if (!user.id) {
            return;
        }

        await ElMessageBox.confirm(`确定要将用户 "${user.username}" 移除管理员身份吗？`, '确认移除', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        });

        const userId = user.id;
        managingUsers.value.add(userId);
        try {
            await deleteManager(detailForm.billId, userId);
            await fetchBillUsers(detailForm.billId);
        } catch (error) {
            console.error('移除管理员失败:', error);
        } finally {
            managingUsers.value.delete(userId);
        }
    };

    // 组件挂载时获取数据
    onMounted(() => {
        fetchBillList();
    });
</script>

<style scoped>
    .bill-list-container {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        overflow: hidden;
        height: calc(100vh - 60px - 40px);
        display: flex;
        flex-direction: column;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e4e7ed;
        background-color: #fafafa;
        flex-shrink: 0;
    }

    .header-left .page-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
    }

    .header-right {
        display: flex;
        gap: 12px;
    }

    .table-container {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .table-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .bill-table {
        border-radius: 6px;
        overflow: hidden;
    }

    :deep(.el-table) {
        border: 1px solid #ebeef5;
    }

    :deep(.el-table__header) {
        background-color: #fafafa;
    }

    :deep(.el-table th) {
        background-color: #fafafa !important;
        color: #606266;
        font-weight: 600;
        border-right: 1px solid #ebeef5;
    }

    :deep(.el-table td) {
        color: #606266;
        border-right: 1px solid #ebeef5;
    }

    :deep(.el-table th:last-child) {
        border-right: none;
    }

    :deep(.el-table td:last-child) {
        border-right: none;
    }

    :deep(.el-table__row:hover) {
        background-color: #f5f7fa;
    }

    :deep(.el-table__row:hover td) {
        border-right: 1px solid #ebeef5;
    }

    :deep(.el-table__row:hover td:last-child) {
        border-right: none;
    }

    .pagination-container {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        flex-shrink: 0;
    }

    :deep(.el-pagination) {
        --el-pagination-font-size: 14px;
    }

    .dialog-footer {
        text-align: right;
    }

    :deep(.el-dialog__header) {
        padding: 20px 20px 10px;
    }

    :deep(.el-dialog__title) {
        font-weight: 600;
        font-size: 18px;
    }

    :deep(.el-dialog__body) {
        padding: 10px 20px 20px;
    }

    :deep(.el-dialog__footer) {
        padding: 10px 20px 20px;
    }

    .detail-content {
        padding: 0;
    }

    .bill-name-section {
        margin-bottom: 24px;
    }

    .name-input-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .name-form {
        flex: 1;
        margin: 0;
    }

    :deep(.name-form) {
        --el-form-label-width: 80px;
    }

    .name-form-item {
        margin-bottom: 0;
    }

    .name-input {
        width: 100%;
    }

    .save-btn {
        flex-shrink: 0;
    }

    :deep(.name-form .el-form-item) {
        margin-bottom: 0;
    }

    :deep(.name-form .el-form-item__content) {
        line-height: normal;
    }

    .users-section {
        border-top: 1px solid #e4e7ed;
        padding-top: 20px;
    }

    .users-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .section-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: normal;
        color: #303133;
    }

    .section-title.bold {
        font-weight: 600;
    }

    .users-list {
        min-height: 100px;
    }

    .empty-users {
        text-align: center;
        color: #909399;
        padding: 40px 0;
        font-size: 14px;
    }

    .user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        margin-bottom: 8px;
        background-color: #fafafa;
        transition: all 0.3s ease;
    }

    .user-item:hover {
        background-color: #f0f9ff;
        border-color: #409eff;
    }

    .user-item:last-child {
        margin-bottom: 0;
    }

    .user-left-section {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .default-avatar {
        width: 100%;
        height: 100%;
        background-color: #409eff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
    }

    .user-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .user-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
    }

    .user-account {
        color: #909399;
        font-size: 12px;
    }

    .user-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .user-role {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
    }

    .role-creator {
        background-color: #fff7e6;
        color: #fa8c16;
        border: 1px solid #ffd591;
    }

    .role-admin {
        background-color: #f6ffed;
        color: #52c41a;
        border: 1px solid #b7eb8f;
    }

    .role-member {
        background-color: #f5f5f5;
        color: #8c8c8c;
        border: 1px solid #d9d9d9;
    }

    .role-unknown {
        background-color: #fafafa;
        color: #bfbfbf;
        border: 1px solid #e8e8e8;
    }

    /* 邀请对话框样式 */
    .invite-content {
        padding: 0;
    }

    .search-section {
        margin-bottom: 20px;
    }

    .search-input-group {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .search-input-group .el-input {
        flex: 1;
    }

    .search-results {
        margin-top: 20px;
    }

    .results-title {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
    }

    .results-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid #e4e7ed;
        border-radius: 6px;
        margin-bottom: 8px;
        background-color: #fafafa;
        transition: all 0.3s ease;
    }

    .result-item:hover {
        background-color: #f0f9ff;
        border-color: #409eff;
    }

    .result-item:last-child {
        margin-bottom: 0;
    }

    .no-results {
        text-align: center;
        color: #909399;
        padding: 40px 0;
        font-size: 14px;
    }
</style>
