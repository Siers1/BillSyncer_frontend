<template>
    <div class="budget-manage-page">
        <div class="content-container">
            <div class="budget-container">
                <div class="page-header">
                    <div class="header-left">
                        <h2 class="page-title">预算管理</h2>
                        <el-select
                            v-model="selectedBillId"
                            placeholder="请选择账本"
                            :loading="billsLoading"
                            style="width: 200px; margin-left: 20px"
                            @visible-change="handleBillSelectVisible"
                            @change="handleBillChange"
                        >
                            <el-option
                                v-for="bill in billList"
                                :key="bill.id"
                                :label="bill.billName"
                                :value="bill.id"
                            />
                        </el-select>
                        <el-date-picker
                            v-model="selectedMonth"
                            type="month"
                            placeholder="选择月份"
                            format="YYYY-MM"
                            value-format="YYYY-MM-01 00:00:00"
                            style="width: 180px; margin-left: 12px"
                            @change="handleMonthChange"
                        />
                    </div>
                    <div class="header-right">
                        <el-button @click="handleRefresh" :icon="Refresh" :loading="loadingBudget">
                            刷新
                        </el-button>
                    </div>
                </div>
                <div class="content-area">
                    <div class="budget-form-section">
                        <el-form :model="budgetForm" label-width="100px" inline>
                            <el-form-item label="预算金额">
                                <el-input-number
                                    v-model="budgetForm.budget"
                                    :min="0"
                                    :precision="2"
                                    :step="100"
                                    placeholder="请输入预算金额"
                                    style="width: 200px"
                                />
                                <span class="unit">元</span>
                            </el-form-item>

                            <el-form-item>
                                <el-button
                                    type="primary"
                                    @click="handleSetBudget"
                                    :loading="settingBudget"
                                >
                                    设置预算
                                </el-button>
                                <el-button @click="handleClearBudget" :loading="clearingBudget">
                                    清空预算
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>
            </div>

            <div class="budget-container">
                <div class="page-header">
                    <div class="header-left">
                        <h2 class="page-title">预算使用情况</h2>
                    </div>
                </div>
                <div class="content-area">
                    <div class="budget-info">
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-label">预算金额</div>
                                <div class="info-value">
                                    <span v-if="budgetData.budget">{{ budgetData.budget }}</span>
                                    <span v-else class="no-limit">未设置</span>
                                </div>
                                <div class="info-unit" v-if="budgetData.budget">元</div>
                            </div>

                            <div class="info-card">
                                <div class="info-label">已花费</div>
                                <div class="info-value">{{ budgetData.expenses || 0 }}</div>
                                <div class="info-unit">元</div>
                            </div>

                            <div class="info-card">
                                <div class="info-label">剩余</div>
                                <div
                                    class="info-value"
                                    v-if="budgetData.budget"
                                    :class="{ negative: isOverBudget }"
                                >
                                    {{ remainingBudget }}
                                </div>
                                <div class="info-value no-limit" v-else> - </div>
                                <div class="info-unit" v-if="budgetData.budget">元</div>
                            </div>
                        </div>

                        <div class="progress-section">
                            <div class="progress-header">
                                <span class="progress-label">预算使用率</span>
                                <span class="progress-percentage">
                                    {{ usagePercentage.toFixed(2) }}%
                                </span>
                            </div>
                            <el-progress
                                :percentage="usagePercentage"
                                :color="progressColor"
                                :stroke-width="20"
                                :show-text="false"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import { ElMessage } from 'element-plus';
    import { Refresh } from '@element-plus/icons-vue';
    import { getAllBills } from '@/api/bill';
    import type { BillDTO } from '@/dto/BillDTO';
    import { getBillBudgetValue, setBillBudget, clearBillBudget } from '@/api/Budget';
    import type { BudgetValueVo } from '@/dto/BudgetValueVo';

    const billList = ref<BillDTO[]>([]);
    const billsLoading = ref(false);
    const selectedBillId = ref<number | undefined>();
    const selectedMonth = ref<string | null>(null);
    const settingBudget = ref(false);
    const clearingBudget = ref(false);
    const loadingBudget = ref(false);

    const budgetForm = ref({
        budget: undefined as number | undefined,
    });

    const budgetData = ref<BudgetValueVo>({
        budget: 0,
        expenses: 0,
    });

    const isOverBudget = computed(() => {
        return budgetData.value.expenses > budgetData.value.budget;
    });

    const remainingBudget = computed(() => {
        const budget = budgetData.value.budget || 0;
        const expenses = budgetData.value.expenses || 0;
        return (budget - expenses).toFixed(2);
    });

    const usagePercentage = computed(() => {
        if (!budgetData.value.budget || budgetData.value.budget === 0) {
            return 0;
        }
        return (budgetData.value.expenses / budgetData.value.budget) * 100;
    });

    const progressColor = computed(() => {
        if (usagePercentage.value < 60) {
            return '#67c23a';
        } else if (usagePercentage.value < 80) {
            return '#e6a23c';
        } else {
            return '#f56c6c';
        }
    });

    const loadBillList = async () => {
        billsLoading.value = true;
        try {
            const bills = await getAllBills();
            billList.value = bills;
        } finally {
            billsLoading.value = false;
        }
    };

    const loadBudgetData = async () => {
        if (!selectedBillId.value || !selectedMonth.value) {
            return;
        }

        loadingBudget.value = true;
        try {
            const data = await getBillBudgetValue(selectedBillId.value, selectedMonth.value);
            budgetData.value = data;
            budgetForm.value.budget = data.budget ?? undefined;
        } finally {
            loadingBudget.value = false;
        }
    };

    const handleBillSelectVisible = async (visible: boolean) => {
        if (visible && billList.value.length === 0) {
            await loadBillList();
        }
    };

    const handleBillChange = () => {
        loadBudgetData();
    };

    const handleMonthChange = () => {
        loadBudgetData();
    };

    const handleRefresh = () => {
        loadBudgetData();
    };

    const handleSetBudget = async () => {
        if (!selectedBillId.value) {
            ElMessage.warning('请先选择账本');
            return;
        }

        if (!selectedMonth.value) {
            ElMessage.warning('请先选择月份');
            return;
        }

        if (!budgetForm.value.budget || budgetForm.value.budget <= 0) {
            ElMessage.warning('请输入有效的预算金额');
            return;
        }

        settingBudget.value = true;
        try {
            await setBillBudget(selectedBillId.value, budgetForm.value.budget, selectedMonth.value);
            await loadBudgetData();
        } finally {
            settingBudget.value = false;
        }
    };

    const handleClearBudget = async () => {
        if (!selectedBillId.value) {
            ElMessage.warning('请先选择账本');
            return;
        }

        if (!selectedMonth.value) {
            ElMessage.warning('请先选择月份');
            return;
        }

        clearingBudget.value = true;
        try {
            await clearBillBudget(selectedBillId.value, selectedMonth.value);
            await loadBudgetData();
        } finally {
            clearingBudget.value = false;
        }
    };

    const initDefaultMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        selectedMonth.value = `${year}-${month}-01 00:00:00`;
    };

    onMounted(() => {
        initDefaultMonth();
        loadBillList();
    });
</script>

<style scoped>
    .budget-manage-page {
        padding: 0;
        background-color: #f5f5f5;
        min-height: calc(100vh - 60px);
    }

    .content-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
    }

    .budget-container {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        overflow: hidden;
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

    .content-area {
        padding: 24px;
    }

    .budget-form-section {
        margin-top: 24px;
        margin-bottom: 12px;
    }

    .section-title {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
    }

    .budget-form {
        padding: 0;
    }

    .unit {
        margin-left: 12px;
        color: #909399;
        font-size: 14px;
    }

    .budget-info {
        padding: 0;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-bottom: 32px;
    }

    .info-card {
        background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
    }

    .info-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .info-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 12px;
        font-weight: 500;
    }

    .info-value {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        margin-bottom: 8px;
        line-height: 1.2;
    }

    .info-value.negative {
        color: #f56c6c;
    }

    .info-value.no-limit {
        color: #67c23a;
        font-size: 28px;
    }

    .info-unit {
        font-size: 14px;
        color: #909399;
        font-weight: 500;
    }

    .progress-section {
        margin-top: 20px;
        padding: 24px;
        background: #f5f7fa;
        border-radius: 12px;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .progress-label {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
    }

    .progress-percentage {
        font-size: 18px;
        font-weight: 700;
        color: #409eff;
    }
</style>