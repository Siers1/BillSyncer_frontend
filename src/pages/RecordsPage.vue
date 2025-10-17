<template>
    <div class="records-container">
        <!-- 页面标题和操作按钮 -->
        <div class="page-header">
            <div class="header-left">
                <h2 class="page-title">消费记录</h2>
                <el-select
                    v-model="selectedBillId"
                    placeholder="请选择账本"
                    style="width: 200px; margin-left: 20px"
                    @change="handleBillChange"
                    @visible-change="handleSelectVisibleChange"
                    :loading="billListLoading"
                >
                    <el-option
                        v-for="bill in billList"
                        :key="bill.id"
                        :label="bill.billName"
                        :value="bill.id"
                    />
                </el-select>
            </div>
            <div class="header-right">
                <el-button 
                    type="primary" 
                    @click="showAddDialog = true"
                    :disabled="!selectedBillId"
                    :icon="Plus"
                >
                    添加消费记录
                </el-button>
                <el-button @click="refreshRecordList" :icon="Refresh" :loading="loading">
                    刷新
                </el-button>
            </div>
        </div>

        <!-- 消费记录列表表格 -->
        <div class="table-container">
            <div class="table-wrapper">
                <el-table
                    :data="recordList"
                    v-loading="loading"
                    style="width: 100%"
                    class="record-table"
                    stripe
                    border
                    :max-height="tableMaxHeight"
                >
<!--                <el-table-column prop="id" label="ID" align="center" min-width="80" />-->
                <el-table-column prop="itemName" label="商品名称" align="center" min-width="120" />
                <el-table-column label="商品价格" align="center" min-width="100">
                    <template #default="scope">
                        {{ scope.row.itemPrice?.toFixed(2) }}
                    </template>
                </el-table-column>
                <el-table-column prop="consumptionType" label="消费类型" align="center" min-width="100" />
                <el-table-column prop="paymentMethod" label="支付方式" align="center" min-width="100" />
                <el-table-column label="消费时间" align="center" min-width="150">
                    <template #default="scope">
                        {{ formatDateTime(scope.row.consumptionDate) }}
                    </template>
                </el-table-column>
                <el-table-column prop="comment" label="备注" align="center" min-width="120">
                    <template #default="scope">
                        {{ scope.row.comment || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center" min-width="150">
                    <template #default="scope">
                        {{ formatDateTime(scope.row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column fixed="right" label="操作" width="160" align="center">
                    <template #default="scope">
                        <el-button
                            type="primary"
                            link
                            size="small"
                            @click="handleEditRecord(scope.row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            type="danger"
                            link
                            size="small"
                            @click="handleDeleteRecord(scope.row)"
                        >
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

        <!-- 添加消费记录对话框 -->
        <el-dialog
            v-model="showAddDialog"
            title="添加消费记录"
            width="600px"
            :before-close="handleCloseAddDialog"
        >
            <el-form
                ref="addFormRef"
                :model="addForm"
                :rules="addFormRules"
                label-width="100px"
            >
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="商品名称" prop="itemName">
                            <el-input v-model="addForm.itemName" placeholder="请输入商品名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品价格" prop="itemPrice">
                            <el-input-number
                                v-model="addForm.itemPrice"
                                :min="0"
                                :precision="2"
                                controls-position="right"
                                style="width: 100%"
                                placeholder="请输入商品价格"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="消费类型" prop="consumptionType">
                            <el-input v-model="addForm.consumptionType" placeholder="请输入消费类型" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="支付方式" prop="paymentMethod">
                            <el-select v-model="addForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
                                <el-option label="现金" value="现金" />
                                <el-option label="微信" value="微信" />
                                <el-option label="支付宝" value="支付宝" />
                                <el-option label="银行卡" value="银行卡" />
                                <el-option label="其他" value="其他" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="消费时间" prop="consumptionDate">
                    <el-date-picker
                        v-model="addForm.consumptionDate"
                        type="datetime"
                        placeholder="请选择消费时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                    />
                </el-form-item>

                <el-form-item label="备注">
                    <el-input
                        v-model="addForm.comment"
                        type="textarea"
                        placeholder="请输入备注（可选）"
                        :rows="3"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleCloseAddDialog">取消</el-button>
                    <el-button type="primary" @click="handleAddRecord" :loading="addLoading">
                        确认添加
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 编辑消费记录对话框 -->
        <el-dialog
            v-model="showEditDialog"
            title="编辑消费记录"
            width="600px"
            :before-close="handleCloseEditDialog"
        >
            <el-form
                ref="editFormRef"
                :model="editForm"
                :rules="editFormRules"
                label-width="100px"
            >
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="商品名称" prop="itemName">
                            <el-input v-model="editForm.itemName" placeholder="请输入商品名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品价格" prop="itemPrice">
                            <el-input-number
                                v-model="editForm.itemPrice"
                                :min="0"
                                :precision="2"
                                controls-position="right"
                                style="width: 100%"
                                placeholder="请输入商品价格"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="消费类型" prop="consumptionType">
                            <el-input v-model="editForm.consumptionType" placeholder="请输入消费类型" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="支付方式" prop="paymentMethod">
                            <el-select v-model="editForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
                                <el-option label="现金" value="现金" />
                                <el-option label="微信" value="微信" />
                                <el-option label="支付宝" value="支付宝" />
                                <el-option label="银行卡" value="银行卡" />
                                <el-option label="其他" value="其他" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="消费时间" prop="consumptionDate">
                    <el-date-picker
                        v-model="editForm.consumptionDate"
                        type="datetime"
                        placeholder="请选择消费时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                    />
                </el-form-item>

                <el-form-item label="备注">
                    <el-input
                        v-model="editForm.comment"
                        type="textarea"
                        placeholder="请输入备注（可选）"
                        :rows="3"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleCloseEditDialog">取消</el-button>
                    <el-button type="primary" @click="handleUpdateRecord" :loading="editLoading">
                        确认修改
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- AI建议面板 -->
        <div class="ai-panel-container">
            <!-- AI建议触发按钮 -->
            <div 
                class="ai-trigger-button"
                @click="toggleAIPanel"
                :class="{ 'active': showAIPanel }"
            >
                <el-icon size="20">
                    <ChatDotRound />
                </el-icon>
                <span>AI建议</span>
            </div>

            <!-- AI建议面板 -->
            <transition name="slide-left">
                <div v-if="showAIPanel" class="ai-panel">
                    <div class="ai-panel-header">
                        <h3>AI消费分析</h3>
                        <el-button 
                            size="small" 
                            text 
                            @click="showAIPanel = false"
                            :icon="Close"
                        />
                    </div>
                    
                    <div class="ai-panel-content">
                        <div v-if="!aiAnalyzing && !aiContent" class="ai-welcome">
                            <el-icon size="48" color="#409eff">
                                <ChatDotRound />
                            </el-icon>
                            <p>点击下方按钮获取AI消费分析建议</p>
                        </div>

                        <div v-if="aiContent" class="ai-response">
                            <div class="ai-message">
                                <el-icon size="16" color="#409eff">
                                    <Avatar />
                                </el-icon>
                                <span class="ai-label">AI助手</span>
                            </div>
                            <div class="ai-content" v-html="formatAIContent(aiContent)"></div>
                        </div>

                        <div v-if="aiAnalyzing" class="ai-loading">
                            <el-icon class="is-loading" size="20">
                                <Loading />
                            </el-icon>
                            <span>AI正在分析您的消费数据...</span>
                        </div>

                        <div v-if="aiError" class="ai-error">
                            <el-icon size="16" color="#f56c6c">
                                <Warning />
                            </el-icon>
                            <span>{{ aiError }}</span>
                        </div>
                    </div>
                    
                    <div class="ai-panel-footer">
                        <el-button 
                            type="primary" 
                            @click="getAIAnalysis"
                            :loading="aiAnalyzing"
                            style="width: 100%"
                        >
                            {{ aiAnalyzing ? '分析中...' : '获取AI分析' }}
                        </el-button>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted, computed } from 'vue';
    import { Refresh, Plus, Edit, Delete, ChatDotRound, Close, Avatar, Loading, Warning } from '@element-plus/icons-vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { getRecordList, addRecord, updateRecord } from '@/api/record';
    import { getAllBills } from '@/api/bill';
    import { analyzeStream } from '@/api/ai';
    import { useAuthStore } from '@/stores/authStore';
    import type { RecordDTO } from '@/dto/RecordDTO';
    import type { UpdateRecordDTO } from '@/dto/UpdateRecordDTO';
    import type { BillDTO } from '@/dto/BillDTO';
    import type { PageParam } from '@/dto/PageParam';
    import type { AIRequest, AIStreamResponse } from '@/dto/AIRequest';
    import { formatDateTime, convertServerDateToLocal, convertLocalDateToServer } from '@/utils/DateUtil';
    import { webSocketService } from '@/utils/websocket';

    // 获取用户store
    const authStore = useAuthStore();

    // 计算表格最大高度
    const tableMaxHeight = computed(() => {
        // 考虑导航栏(60px) + 页面内边距(40px) + 页面头部(约80px) + 分页器(约60px) + 表格容器内边距(48px)
        return 'calc(100vh - 288px)';
    });

    // 数据构建工具函数
    const buildRecordData = (formData: RecordDTO, billId: number, creatorId: number): RecordDTO => ({
        billId,
        creatorId,
        itemName: formData.itemName,
        itemPrice: formData.itemPrice,
        consumptionType: formData.consumptionType,
        paymentMethod: formData.paymentMethod,
        consumptionDate: convertLocalDateToServer(formData.consumptionDate || ''),
        comment: formData.comment || ''
    });

    const buildUpdateData = (formData: UpdateRecordDTO): UpdateRecordDTO => ({
        id: formData.id,
        itemName: formData.itemName,
        itemPrice: formData.itemPrice,
        consumptionType: formData.consumptionType,
        paymentMethod: formData.paymentMethod,
        consumptionDate: convertLocalDateToServer(formData.consumptionDate || ''),
        comment: formData.comment || ''
    });

    const buildDeleteData = (id: number): UpdateRecordDTO => ({
        id,
        valid: 0
    });

    // 响应式数据
    const recordList = ref<RecordDTO[]>([]);
    const billList = ref<BillDTO[]>([]);
    const loading = ref(false);
    const billListLoading = ref(false);
    const selectedBillId = ref<number>();

    // 分页相关
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalRow = ref(0);

    // 添加记录相关
    const showAddDialog = ref(false);
    const addLoading = ref(false);
    const addFormRef = ref();
    const addForm = ref<RecordDTO>({
        itemName: '',
        itemPrice: undefined,
        consumptionType: '',
        paymentMethod: '',
        consumptionDate: '',
        comment: ''
    });

    // 编辑记录相关
    const showEditDialog = ref(false);
    const editLoading = ref(false);
    const editFormRef = ref();
    const editForm = ref<UpdateRecordDTO>({
        id: 0,
        itemName: '',
        itemPrice: undefined,
        consumptionType: '',
        paymentMethod: '',
        consumptionDate: '',
        comment: ''
    });

    // AI建议相关
    const showAIPanel = ref(false);
    const aiAnalyzing = ref(false);
    const aiContent = ref('');
    const aiError = ref('');

    // 表单验证规则
    const addFormRules = {
        itemName: [
            { required: true, message: '请输入商品名称', trigger: 'blur' },
            { min: 1, max: 50, message: '商品名称长度在1到50个字符', trigger: 'blur' }
        ],
        itemPrice: [
            { required: true, message: '请输入商品价格', trigger: 'blur' },
            { type: 'number', min: 0.01, message: '商品价格必须大于0', trigger: 'blur' }
        ],
        consumptionType: [
            { required: true, message: '请输入消费类型', trigger: 'change' }
        ],
        paymentMethod: [
            { required: true, message: '请选择支付方式', trigger: 'change' }
        ],
        consumptionDate: [
            { required: true, message: '请选择消费时间', trigger: 'change' }
        ]
    };

    // 编辑表单验证规则
    const editFormRules = {
        itemName: [
            { required: true, message: '请输入商品名称', trigger: 'blur' },
            { min: 1, max: 50, message: '商品名称长度在1到50个字符', trigger: 'blur' }
        ],
        itemPrice: [
            { required: true, message: '请输入商品价格', trigger: 'blur' },
            { type: 'number', min: 0.01, message: '商品价格必须大于0', trigger: 'blur' }
        ],
        consumptionType: [
            { required: true, message: '请选择消费类型', trigger: 'change' }
        ],
        paymentMethod: [
            { required: true, message: '请选择支付方式', trigger: 'change' }
        ],
        consumptionDate: [
            { required: true, message: '请选择消费时间', trigger: 'change' }
        ]
    };

    // 获取账本列表
    const fetchBillList = async () => {
        billListLoading.value = true;
        try {
            const response = await getAllBills();
            billList.value = response;
        } finally {
            billListLoading.value = false;
        }
    };

    // 下拉列表可见性变化处理
    const handleSelectVisibleChange = (visible: boolean) => {
        if (visible) {
            // 下拉列表展开时获取最新的账本数据
            fetchBillList();
        }
    };

    // 获取消费记录列表
    const fetchRecordList = async () => {
        if (!selectedBillId.value) {
            recordList.value = [];
            totalRow.value = 0;
            return;
        }

        loading.value = true;
        try {
            const params: PageParam<RecordDTO> = {
                pageNum: currentPage.value,
                pageSize: pageSize.value,
                params: {
                    billId: selectedBillId.value
                },
            };
            const response = await getRecordList(params);
            recordList.value = response.records;
            totalRow.value = response.totalRow;
        } finally {
            loading.value = false;
        }
    };

    // 账本选择改变
    const handleBillChange = () => {
        currentPage.value = 1;
        fetchRecordList();
    };

    // 刷新列表
    const refreshRecordList = () => {
        fetchRecordList();
    };

    // 分页大小改变
    const handleSizeChange = (val: number) => {
        pageSize.value = val;
        currentPage.value = 1;
        fetchRecordList();
    };

    // 当前页改变
    const handleCurrentChange = (val: number) => {
        currentPage.value = val;
        fetchRecordList();
    };

    // 重置添加表单
    const resetAddForm = () => {
        addForm.value = {
            itemName: '',
            itemPrice: undefined,
            consumptionType: '',
            paymentMethod: '',
            consumptionDate: '',
            comment: ''
        };
        addFormRef.value?.clearValidate();
    };

    // 关闭添加对话框
    const handleCloseAddDialog = () => {
        showAddDialog.value = false;
        resetAddForm();
    };

    // 重置编辑表单
    const resetEditForm = () => {
        editForm.value = {
            id: 0,
            itemName: '',
            itemPrice: undefined,
            consumptionType: '',
            paymentMethod: '',
            consumptionDate: '',
            comment: ''
        };
        editFormRef.value?.clearValidate();
    };

    // 关闭编辑对话框
    const handleCloseEditDialog = () => {
        showEditDialog.value = false;
        resetEditForm();
    };

    // 添加消费记录
    const handleAddRecord = async () => {
        if (!(await addFormRef.value?.validate())) return;

        if (!selectedBillId.value) {
            return;
        }

        addLoading.value = true;
        try {
            if (!authStore.user || !authStore.user.id) {
                ElMessage.error('用户信息获取失败，请重新登录');
                return;
            }
            const recordData = buildRecordData(addForm.value, selectedBillId.value, authStore.user.id);
            await addRecord(recordData);
            handleCloseAddDialog();
            fetchRecordList(); // 刷新列表
        } finally {
            addLoading.value = false;
        }
    };

    // 填充编辑表单数据
    const fillEditForm = (record: RecordDTO) => {
        editForm.value = {
            id: record.id!,
            itemName: record.itemName,
            itemPrice: record.itemPrice,
            consumptionType: record.consumptionType,
            paymentMethod: record.paymentMethod,
            consumptionDate: convertServerDateToLocal(record.consumptionDate || ''),
            comment: record.comment
        };
    };

    // 编辑消费记录
    const handleEditRecord = (record: RecordDTO) => {
        fillEditForm(record);
        showEditDialog.value = true;
    };

    // 更新消费记录
    const handleUpdateRecord = async () => {
        if (!(await editFormRef.value?.validate())) return;

        editLoading.value = true;
        try {
            const updateData = buildUpdateData(editForm.value);
            await updateRecord(updateData);
            handleCloseEditDialog();
            fetchRecordList(); // 刷新列表
        } finally {
            editLoading.value = false;
        }
    };

    // 删除消费记录
    const handleDeleteRecord = async (record: RecordDTO) => {
        ElMessageBox.confirm(
            `确定要删除商品"${record.itemName}"的消费记录吗？`,
            '确认删除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(async () => {
                const deleteData = buildDeleteData(record.id!);
                await updateRecord(deleteData);
                fetchRecordList(); // 刷新列表
        }).catch(() => {
            // 用户取消删除，不做任何操作
        });
    };

    // WebSocket 消息监听回调
    const handleWebSocketMessage = (message: string) => {
        console.log('RecordsPage 收到 WebSocket 消息:', message);
        // 当收到邀请相关消息时，刷新账本列表
        // 这样当用户接受邀请后，账本列表会自动更新
        fetchBillList();
    };

    // 组件挂载时设置 WebSocket 监听
    onMounted(() => {
        // 添加 WebSocket 消息监听器，用于实时更新账本列表
        webSocketService.addMessageListener(handleWebSocketMessage);
        
        // 不再主动获取账本列表，改为在下拉列表展开时获取
        // 这样确保每次都是最新数据
    });

    // AI面板相关功能
    const toggleAIPanel = () => {
        showAIPanel.value = !showAIPanel.value;
        // 清除之前的错误信息
        if (showAIPanel.value) {
            aiError.value = '';
        }
    };

    // 格式化AI内容，支持换行和基本格式
    const formatAIContent = (content: string) => {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    // 获取AI分析
    const getAIAnalysis = async () => {
        if (!selectedBillId.value) {
            ElMessage({
                type: 'warning',
                message: '请先在页面上方选择一个账本，然后再获取AI分析',
                duration: 3000
            });
            return;
        }

        aiAnalyzing.value = true;
        aiContent.value = '';
        aiError.value = '';

        const aiRequest: AIRequest = {
            messageList: [
                {
                    role: "user",
                    content: "你好!"
                }
            ],
            billId: selectedBillId.value
        };

        try {
            await analyzeStream(
                aiRequest,
                // 接收流式数据的回调
                (data: AIStreamResponse) => {
                    if (data.content && data.content !== 'null') {
                        aiContent.value += data.content;
                    }
                },
                // 错误处理回调
                (error: Error) => {
                    console.error('AI分析出错:', error);
                    aiError.value = '获取AI分析失败，请稍后重试';
                    aiAnalyzing.value = false;
                },
                // 完成时的回调
                () => {
                    aiAnalyzing.value = false;
                    if (!aiContent.value.trim()) {
                        aiError.value = '未收到有效的AI分析结果';
                    }
                }
            );
        } catch (error) {
            console.error('AI分析请求失败:', error);
            aiError.value = '连接AI服务失败，请检查网络连接';
            aiAnalyzing.value = false;
        }
    };

    // 组件卸载时清理
    onUnmounted(() => {
        // 移除 WebSocket 消息监听器
        webSocketService.removeMessageListener(handleWebSocketMessage);
    });
</script>

<style scoped>
    .records-container {
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

    .header-left {
        display: flex;
        align-items: center;
    }

    .header-left .page-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
    }

    .header-right {
        display: flex;
        align-items: center;
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

    .record-table {
        border-radius: 6px;
        overflow: hidden;
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

    /* 表格样式 */
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

    /* 操作按钮间距 */
    :deep(.el-table__cell) .el-button + .el-button {
        margin-left: 8px;
    }

    /* AI面板相关样式 */
    .ai-panel-container {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1000;
    }

    .ai-trigger-button {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #409eff, #67c23a);
        color: white;
        padding: 12px 8px;
        border-radius: 8px 0 0 8px;
        cursor: pointer;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        writing-mode: vertical-lr;
        text-orientation: mixed;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-height: 100px;
        justify-content: center;
    }

    .ai-trigger-button:hover {
        background: linear-gradient(135deg, #337ecc, #5daf34);
        transform: translateY(-50%) translateX(-2px);
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
    }

    .ai-trigger-button.active {
        background: linear-gradient(135deg, #337ecc, #5daf34);
        transform: translateY(-50%) translateX(-2px);
    }

    .ai-trigger-button span {
        font-size: 14px;
        font-weight: 500;
        writing-mode: vertical-lr;
        text-orientation: upright;
        letter-spacing: 2px;
    }

    .ai-panel {
        position: absolute;
        right: 48px;
        top: 50%;
        transform: translateY(-50%);
        width: 380px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .ai-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e4e7ed;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    }

    .ai-panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
    }

    .ai-panel-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .ai-welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        color: #909399;
    }

    .ai-welcome p {
        margin: 16px 0 0 0;
        font-size: 14px;
        line-height: 1.5;
    }

    .ai-response {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .ai-message {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .ai-label {
        font-size: 14px;
        font-weight: 600;
        color: #409eff;
    }

    .ai-content {
        background: #f4f6f8;
        padding: 16px;
        border-radius: 8px;
        line-height: 1.6;
        font-size: 14px;
        color: #303133;
        word-wrap: break-word;
        white-space: pre-wrap;
    }

    .ai-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        height: 100%;
        color: #409eff;
        font-size: 14px;
    }

    .ai-error {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #fef0f0;
        border: 1px solid #fbc4c4;
        border-radius: 8px;
        color: #f56c6c;
        font-size: 14px;
    }

    .ai-panel-footer {
        padding: 16px 20px;
        border-top: 1px solid #e4e7ed;
        background: #fafafa;
    }

    /* 滑入动画 */
    .slide-left-enter-active,
    .slide-left-leave-active {
        transition: all 0.3s ease;
    }

    .slide-left-enter-from {
        transform: translateY(-50%) translateX(100%);
        opacity: 0;
    }

    .slide-left-leave-to {
        transform: translateY(-50%) translateX(100%);
        opacity: 0;
    }
</style>