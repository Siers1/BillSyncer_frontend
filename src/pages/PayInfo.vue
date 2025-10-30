<template>
  <div class="analysis-page">
    <!-- 支付方式容器 -->
    <div class="payment-container">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">支付方式</h2>
        </div>
        <div class="header-right">
          <el-button @click="refresh" :icon="Refresh" :loading="loading">刷新</el-button>
        </div>
      </div>
      <div class="content-area">
        <div ref="chartContainerRef" class="chart"></div>
      </div>
    </div>

    <!-- 支出趋势容器 -->
    <div class="trend-container">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">支出趋势</h2>
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
        </div>
        <div class="header-right">
          <el-date-picker
            v-model="trendRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 420px"
            clearable
            @change="handleTrendRangeChange"
          />
          <el-button @click="refreshTrend" :icon="Refresh" :loading="trendLoading">刷新</el-button>
        </div>
      </div>
      <div class="content-area">
        <div class="trend-chart" ref="trendChartRef"></div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as echarts from 'echarts';
import { getTypeSt } from '@/api/statistics';
import type { PaymentVo } from '@/dto/PaymentVo';
import { Refresh } from '@element-plus/icons-vue';
import { getAllBills } from '@/api/bill';
import { getStatistics } from '@/api/statistics';
import type { BillDTO } from '@/dto/BillDTO';
import type { StatisticDTO } from '@/dto/StatisticDTO';
import type { StatisticsVo } from '@/dto/StatisticsVo';

const chartContainerRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const loading = ref(false);

// 支出趋势相关
const billList = ref<BillDTO[]>([]);
const billsLoading = ref(false);
const selectedBillId = ref<number | undefined>();
const trendRange = ref<[string, string] | null>(null);
const trendLoading = ref(false);
const trendChartRef = ref<HTMLDivElement | null>(null);
let trendChartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (!chartContainerRef.value) return;
  chartInstance = echarts.init(chartContainerRef.value);
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;
  trendChartInstance = echarts.init(trendChartRef.value);
};

const setChartOption = (items: PaymentVo[]) => {
  if (!chartInstance) return;
  const seriesData = items.map(item => ({ value: item.proportion, name: item.type }));
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}: ${params.value}%`,
    },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: '支付方式',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: {
          label: {
            show: true,
            fontSize: 32,
            fontWeight: 'bold',
            formatter: '{b}\n{c}%',
          },
        },
        labelLine: { show: false },
        data: seriesData,
      },
    ],
  };
  chartInstance.setOption(option);
};

const handleResize = () => {
  chartInstance?.resize();
  trendChartInstance?.resize();
};

const loadData = async () => {
  if (!chartInstance) return;
  loading.value = true;
  chartInstance.showLoading('default', { text: '加载中...' });
  try {
    const data = await getTypeSt();
    setChartOption(Array.isArray(data) ? data : []);
  } catch (e) {
    setChartOption([]);
  } finally {
    chartInstance.hideLoading();
    loading.value = false;
  }
};

const refresh = () => {
  loadData();
};

onMounted(async () => {
  initChart();
  await loadData();
  // 初始化账本与趋势图
  await fetchBills();
  initTrendChart();
  await loadTrendData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
  trendChartInstance?.dispose();
  trendChartInstance = null;
});

// 获取账本列表
const fetchBills = async () => {
  billsLoading.value = true;
  try {
    billList.value = await getAllBills();
    if (!selectedBillId.value && billList.value.length > 0) {
      selectedBillId.value = billList.value[0].id;
    }
    // 初始化默认时间范围：本月初到今天
    if (!trendRange.value || trendRange.value.length !== 2) {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1); // 本月1号
      const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trendRange.value = [
        `${fmtDate(start)} 00:00:00`,
        `${fmtDate(end)} 23:59:59`
      ];
    }
    // 账本和时间初始化完成后，加载趋势数据
    await loadTrendData();
  } finally {
    billsLoading.value = false;
  }
};

const handleBillSelectVisible = (visible: boolean) => {
  if (visible) fetchBills();
};

// 补全日期范围，缺失的日期填充0
const fillMissingDates = (data: StatisticsVo[], startDateStr: string, endDateStr: string) => {
  // 解析开始和结束日期
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split(' ')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };
  
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  
  // 构建日期到金额的映射
  const dateMap = new Map<string, number>();
  data.forEach(item => {
    const dateKey = item.time.split(' ')[0]; // 只取日期部分 YYYY-MM-DD
    dateMap.set(dateKey, parseFloat(item.total));
  });
  
  // 生成完整的日期序列
  const result: { date: string; value: number }[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    result.push({
      date: dateKey,
      value: dateMap.get(dateKey) || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return result;
};

// 加载趋势数据
const loadTrendData = async () => {
  if (!trendChartInstance) return;
  if (!selectedBillId.value || !Array.isArray(trendRange.value)) {
    // 清空
    trendChartInstance.setOption({
      xAxis: { type: 'category', data: [] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [] }],
    } as echarts.EChartsOption);
    return;
  }
  trendLoading.value = true;
  trendChartInstance.showLoading('default', { text: '加载中...' });
  try {
    const payload: StatisticDTO = {
      billId: selectedBillId.value,
      startDate: trendRange.value[0],
      endDate: trendRange.value[1],
    };
    const list: StatisticsVo[] = await getStatistics(payload);
    
    // 补全缺失日期
    const completeData = fillMissingDates(list, trendRange.value[0], trendRange.value[1]);
    const categories = completeData.map(i => i.date);
    const values = completeData.map(i => i.value);
    
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value' },
      series: [
        { type: 'line', data: values, smooth: false, showSymbol: true }
      ]
    };
    trendChartInstance.setOption(option);
  } finally {
    trendChartInstance.hideLoading();
    trendLoading.value = false;
  }
};

const refreshTrend = () => {
  loadTrendData();
};

// 交互：切换账本与日期直接刷新
const handleBillChange = () => {
  loadTrendData();
};

const handleTrendRangeChange = () => {
  loadTrendData();
};
</script>

<style scoped>
  .analysis-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* 支付方式容器 */
  .payment-container {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  /* 支出趋势容器 */
  .trend-container {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  /* 页面标题栏样式 - 与账本列表/消费记录一致 */
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
    gap: 12px;
  }

  /* 内容区域 */
  .content-area {
    padding: 24px;
  }

  .chart {
    width: 100%;
    height: 420px;
  }

  .trend-chart {
    width: 100%;
    height: 420px;
  }
</style>