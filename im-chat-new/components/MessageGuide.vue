<template>
  <div class="message-guide">
    <div class="message-guide-box">
      <div class="message-guide-box-label">
        Sorry, we aren't online at the moment. Leave a message and we'll get back to you.
      </div>
      <contactUs @submit="$emit('messageSubmit', 0)"></contactUs>
      <!--       
      <el-button
        :loading="loading"
        class="message-guide-btn"
        type="primary"
        round
        @click="handleContactUs(sceneCode, orderType)"
      >
        Leave a message
      </el-button> -->
    </div>

    <div class="message-guide-message">
      <div class="message-guide-message-header">
        <div class="message-guide-message-title">You might want to know</div>
        <el-link target="_blank" :href="$getJumpLink(getHelpPath())" class="message-guide-message-link">
          Show More
          <i class="el-icon-arrow-right"></i>
        </el-link>
      </div>
      <div v-for="item of docList" :key="item.cmsHelpDocRecordAccessId" class="mes-list-item" @click="goHelpDoc(item)">
        {{ item.title }}
        <i class="el-icon-arrow-right"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref, inject } from 'vue'
  import contactUs from './contact/index.vue'
  import { hasOnlineEmployee, imQueryDocManagePageApi, preAllocatedEmployee } from '#shared/apis'
  import { getEnvConfig, getJumpLink } from '#shared/utils'
  defineProps({
    sceneCode: {
      type: Number,
      default: 101 // 101 全部客服不在线， 102 业务线客服不在线
    },
    orderType: {
      type: [String, Number],
      default: ''
    }
  })
  const getLang = inject<any>('getLang')
  const emit = defineEmits(['chat', 'messageSubmit'])
  const docList = ref<any[]>([])
  const envConfig = getEnvConfig()
  const loading = ref(false)
  // 获取帮助文档页面
  function getHelpPath() {
    const origin = location.origin
    switch (true) {
      case origin === envConfig.SHOP_CART_BASE_URL: // 购物车
        return `${envConfig.PCB_BASE_URL}/help`
      case origin === envConfig.CHECKOUT_BASE_URL: // 结算页域名
        return `${envConfig.PCB_BASE_URL}/help`
      case origin === envConfig.PCB_LAYOUT_BASE_RUL: // layout
        return `${envConfig.PCB_BASE_URL}/help`
      case origin === envConfig.DFM_TOOL_BASE_URL: // DFM独立站
        return `${envConfig.PCB_BASE_URL}/help/catalog/2061-DFM-Tool-Help`
      case origin === envConfig.PCB_BASE_URL: // PCB
        return '/help'
      case origin === envConfig.TD_BASE_URL: // 3D
        return '/help'
      case origin === envConfig.CNC_BASE_URL: // CNC
        return '/help'
      case origin === envConfig.FA_BASE_URL: // FA 域名
        return '/help'
      default:
        return `${envConfig.PCB_BASE_URL}/help`
    }
  }

  // 将标题空格转成-
  const transQueryTitle = (title = '') => {
    return title?.replace(/\s/g, '-')
  }

  // 获取五条帮助文档
  async function getHelpList() {
    const origin = location.origin
    // useType 0:pcb 1:3d 2:fa 3:cnc
    let useType = 0
    switch (true) {
      case origin === envConfig.SHOP_CART_BASE_URL: // 购物车
        useType = 0
        break
      case origin === envConfig.CHECKOUT_BASE_URL: // 结算页域名
        useType = 0
        break
      case origin === envConfig.PCB_LAYOUT_BASE_RUL: // layout
        useType = 0
        break
      case origin === envConfig.DFM_TOOL_BASE_URL: // DFM独立站
        useType = 0
        break
      case origin === envConfig.PCB_BASE_URL: // PCB
        useType = 0
        break
      case origin === envConfig.TD_BASE_URL: // 3D
        useType = 1
        break
      case origin === envConfig.CNC_BASE_URL: // CNC
        useType = 3
        break
      case origin === envConfig.FA_BASE_URL: // FA 域名
        useType = 2
        break
      default:
        useType = 0
    }
    const res = await imQueryDocManagePageApi({
      pageNum: 1,
      pageSize: 5,
      useType,
      languageCode: getLang()
    })

    const datas = res || {}
    docList.value = datas.list || []
  }

  // 获取联系我们链接
  function getContactUsLink() {
    const helpLink = getHelpPath()
    return `${helpLink}/contact`
  }

  // 跳转到联系我们
  async function handleContactUs(sceneCode: number, orderType: number | string) {
    loading.value = true
    try {
      // 判断是否有客服在线
      let res = null
      switch (sceneCode) {
        case 101:
          res = await hasOnlineEmployee()
          break
        case 102:
          // 预分配处理人
          res = await preAllocatedEmployee({ orderType: String(orderType) })
          break
        default:
          break
      }

      if (!res) {
        window.open(getJumpLink(getContactUsLink(), getLang()), '_blank')
      } else {
        emit('chat')
      }
    } catch (err) {
      console.log(err)
    } finally {
      loading.value = false
    }
  }

  // 跳转到帮助文档
  function goHelpDoc(item: any) {
    window.open(getJumpLink(handleDetail(item), getLang()), '_blank')
  }

  // 跳转文档详情
  function handleDetail(item: any) {
    const helpLink = getHelpPath()
    return `${helpLink}/article/${transQueryTitle(item.locationUri)}`
  }

  onMounted(() => {
    getHelpList()
  })
</script>

<style lang="scss" scoped>
  .mes-list-item {
    display: flex;
    margin-bottom: 16px;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    &:hover {
      color: #2b8ced;
    }
  }
  .message-guide {
    margin: 0 12px;
    height: calc(100% - 42px);
    overflow-y: auto;
  }
  .message-guide-message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .message-guide-message-link {
    color: #2b8ced;
    font-size: 12px;
  }
  .message-guide-message-title {
    font-size: 16px;
    font-weight: bold;
  }
  .message-guide-box {
    margin: 18px 0 32px;
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    padding: 16px 12px;
  }
  .message-guide-box-label {
    font-size: 16px;
    margin-bottom: 12px;
    line-height: 22px;
  }

  .message-guide-btn {
    width: 100%;
  }
</style>
