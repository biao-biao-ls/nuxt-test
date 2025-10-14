<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="wm-chat-inside" :class="{ active: isShowWindow }">
    <div v-show="isShowWindow" class="chat-window" :class="{ 'no-employee': !isHasOnlineEmployee }">
      <div class="chat-window-bg"></div>
      <div class="chat-window-wrapper relative" @dragover.prevent="handleDragOver">
        <ChatHeader
          :show-more-btn="showMoreBtn"
          :platform="platform"
          :history-flag="historyFlag"
          @min="handleWinMin"
          @close="handleWinClose"
          @openSendTranscript="handleSendTranscript"
          @backSelBusiness="handleBackSelBusiness"
        />
        <!-- 有客服在线 -->
        <template v-if="isHasOnlineEmployee">
          <!-- <ChatTime /> -->
          <div ref="chatContainerRef" class="chat-container">
            <ChatBusinessSelect
              v-if="chatStep === 'business'"
              :value="currentBusiness"
              :msg="tipMsg"
              @select="handleSelectBusiness"
              @handleViewHistory="handleViewHistory"
            />
            <div v-else-if="chatStep === 'loadChat'" class="chat-waiting">
              <ChatTime :date-time="Date.now()" />
              <ChatItem :item="tipMsg" @min="handleWinMin" />
            </div>
            <ChatContainer
              v-else-if="chatStep === 'chat'"
              :is-more="isCanScrollToTop"
              :msgs="msgs"
              @loadPreMsgs="handleLoadPreMsgs"
              @submitEvaluation="handleSubmitEvaluation"
              @revoke="handleRevoke"
              @resend="handleResend"
              @onQuoteMsg="handleQuoteMsg"
            />
            <ChatLoading v-if="isShowLoading" />
          </div>

          <!-- 文件列表 -->
          <div
            v-if="fileList.length && chatStep === 'chat' && !historyFlag"
            :class="['uploadFileBox', { uploadFileBoxExtend: !isDetailExtend }]"
          >
            <div class="uploadedNum flex justify-between cursor-pointer" @click="isDetailExtend = !isDetailExtend">
              <span>{{ fileUploadSuccessLen.length || 0 }} uploaded</span>
              <svg-icon name="arrow_down" class="ml-[10px] text-[#666]" width="16px" height="16px"></svg-icon>
            </div>

            <div v-if="!isDetailExtend" class="fileList mt-10">
              <div v-for="item in fileList" :key="item.id" class="fileItemBox" :class="{ isSelected: item.selected }">
                <div class="fileItem" @click="item.uploadStatus === 'success' && (item.selected = !item.selected)">
                  <i v-if="item.uploadStatus === 'loading'" class="el-icon-loading chat-img-loading mr-5"></i>
                  <template v-else>
                    <span @click.stop>
                      <el-checkbox v-model="item.selected" :disabled="item.uploadStatus !== 'success'"></el-checkbox>
                    </span>
                    <svg-icon
                      :name="getFileTypeIcon(item.file.name)"
                      class="mx-4 text-[#666]"
                      width="24px"
                      height="24px"
                    ></svg-icon>
                  </template>
                  <div class="fileName">{{ nameWithoutExtension(item.file.name, 25) }}</div>

                  <svg-icon
                    name="close_pop_nol"
                    class="ml-[10px] text-[#666] cursor-pointer"
                    width="24px"
                    height="24px"
                    @click.native.stop="delFile(item)"
                  ></svg-icon>
                </div>
                <el-progress
                  v-if="item.uploadStatus === 'loading' && item.percentage < 100"
                  :stroke-width="2"
                  :percentage="item.percentage"
                  :show-text="false"
                ></el-progress>
              </div>
            </div>

            <div v-if="!isDetailExtend" class="flex-center">
              <el-button
                type="primary"
                size="mini"
                :disabled="!fileListSelectedArr.length"
                class="send-file-btn"
                @click="sendFile"
              >
                Send files
              </el-button>
            </div>
          </div>
          <ChatFooter
            v-show="!historyFlag"
            ref="ChatFooterRef"
            :chat-step="chatStep"
            :disabled="!currentBusiness"
            :is-start-intelligenticon="isStartIntelligenticon"
            :upload-config="uploadConfig"
            :platform="platform"
            :is-queuing="isQueuing"
            :quote-msg="quoteMsg"
            @start="handleStartChat"
            @sendMessage="handleTextMessage"
            @showOrder="isShowOrderPopup = true"
            @rateService="handleRateService"
            @uploadFile="handleUploadFile"
            @selectFile="handleFileSelect"
            @intelligenticon="handleIntelligenticon"
            @sendFaqMessage="handleSendFaqMessage"
            @paste="handlePaste"
            @openSendTranscript="handleSendTranscript"
            @message="isShowMessageModal = true"
            @close="handleWinClose"
          />
          <!-- 再次发起聊天 -->
          <div v-if="historyFlag" class="chat-business-footer">
            <el-button type="primary" class="chat-business-footer-btn" round @click="handleBackSelBusiness()">
              Start the chat again
            </el-button>
          </div>
        </template>
        <MessageGuide
          v-else
          :scene-code="sceneCode"
          :order-type="currentBusiness?.value"
          @chat="initImStatus"
          @messageSubmit="onLeaveMessage(0)"
        ></MessageGuide>
        <!-- 拖拽上传区域 -->
        <div
          v-if="isDragging && isHasOnlineEmployee && chatStep === 'chat'"
          class="drop-dialog-modal"
          data-drag="dragTag"
        >
          <div class="drop-dialog-box relative" data-drag="dragTag" @dragleave.prevent="handleDragLeave">
            <div class="drop-dialog-box-modal" data-drag="dragTag"></div>
            <div class="drop-dialog" data-drag="dragTag" @drop.prevent="handleDrop">
              <div class="drop-dialog-title" data-drag="dragTag">Upload</div>
              <div class="drop-dialog-content" data-drag="dragTag">
                <i class="el-icon-upload upload-icon" data-drag="dragTag"></i>
                <span data-drag="dragTag">Drop files here</span>
              </div>
              <input
                ref="uploadElemRef"
                :accept="uploadConfig.accept.join(',')"
                type="file"
                hidden
                @change="handleFileSelect"
              />
            </div>
          </div>
        </div>
      </div>
      <ChatPopup
        v-if="isShowWindow"
        v-show="isShowOrderPopup"
        ref="orderListRef"
        :class="{ 'popup-overlay': isShowOrderPopup }"
        @close="isShowOrderPopup = false"
        @sendOrder="handleSendOrder"
      />
      <IntelligenticonDialog
        v-if="isShowIntelligenticon && platform === 'PC'"
        :is-open="isStartIntelligenticon"
        @close="isShowIntelligenticon = false"
        @change="handleIntelligenticonChange"
      />
      <Popup v-if="platform === 'H5'" :is-visible="isShowIntelligenticon" @close="isShowIntelligenticon = false">
        <IntelligenticonContent :is-open="isStartIntelligenticon" @change="handleIntelligenticonChange" />
      </Popup>
      <!-- <CloseTheChat
        v-if="platform === 'PC' && isCloseTheChat"
        @close="isCloseTheChat = false"
        @click="handleCloseChat"
      /> -->
      <!-- <Popup v-if="platform === 'H5'" :is-visible="isCloseTheChat" @close="isCloseTheChat = false">
        <CloseTheChatContent platform="H5" @click="handleCloseChat" />
      </Popup> -->

      <ChatTips v-if="isShowTip" :message="chatTipMessage" />

      <TranscriptModal
        v-if="transcriptChatRecordModal && platform === 'PC'"
        :bind-email="bindEmail"
        @close="transcriptChatRecordModal = false"
        @submit="setBindEmail"
      ></TranscriptModal>
      <Popup
        v-if="platform === 'H5'"
        :is-visible="transcriptChatRecordModal"
        @close="transcriptChatRecordModal = false"
      >
        <TranscriptContent :bind-email="bindEmail" @close="transcriptChatRecordModal = false" @submit="setBindEmail" />
      </Popup>
      <Popup
        v-if="platform === 'H5'"
        :is-visible="transcriptChatRecordModal"
        @close="transcriptChatRecordModal = false"
      >
        <TranscriptContent :bind-email="bindEmail" @close="transcriptChatRecordModal = false" @submit="setBindEmail" />
      </Popup>
      <Popup v-if="platform === 'H5'" :is-visible="isShowH5RateService" @close="isShowH5RateService = false">
        <ChatRateService platform="H5" @submit="handleSubmitEvaluation" />
      </Popup>

      <!-- 排队5秒后弹窗提示 v-if="showWaitingMessage"-->
      <ImDialog v-if="isShowWaitingMessage" @close="isShowWaitingMessage = false">
        <div class="leave-tips">
          Sorry, wait times may be longer due to peak hours. Would you prefer to leave a message? We will get back to
          you via email.
        </div>
        <div class="flex items-center justify-center">
          <el-button
            class="queue-message-btn flex-1"
            round
            @click="
              isShowMessageModal = true
              isShowWaitingMessage = false
            "
          >
            <div class="flex items-center justify-center">Leave a message</div>
          </el-button>
          <span></span>
          <el-button class="queue-waiting-btn flex-1" type="primary" round @click="isShowWaitingMessage = false">
            <div class="flex items-center justify-center">Keep waiting</div>
          </el-button>
        </div>
      </ImDialog>
      <!-- 留言弹窗 -->
      <ImDialog v-if="isShowMessageModal" @close="isShowMessageModal = false">
        <contactUs @submit="onLeaveMessage(1)"></contactUs>
      </ImDialog>

      <!-- 评价弹窗 -->
      <ImDialog v-if="isCloseTheChat && platform !== 'H5'" @close="isCloseTheChat = false">
        <ChatRateService v-if="isCloseTheChat" :is-close-conversation="true" @submit="handleSubmitEvaluation" />
      </ImDialog>
      <Popup v-if="platform === 'H5'" :is-visible="isCloseTheChat" @close="isCloseTheChat = false">
        <ChatRateService v-if="isCloseTheChat" :is-close-conversation="true" @submit="handleSubmitEvaluation" />
      </Popup>

      <!-- 在线转邮件工单关闭提示 3秒自动关闭-->
      <ImDialog v-if="isTransferEmailCloseFlag" :show-close-icon="false" @close="isTransferEmailCloseFlag = false">
        <div class="leave-tips">
          Thank you for waiting! We're experiencing high chat volume and will email you later.
        </div>
        <div class="flex items-center justify-end">
          <el-button class="queue-waiting-btn" type="primary" round @click="closeTransferEmailTipModal">
            <div class="flex items-center justify-center">
              Close
              <span v-if="transferEmailCloseCountDown > 0" class="ml-[5px]">({{ transferEmailCloseCountDown }})</span>
            </div>
          </el-button>
        </div>
      </ImDialog>
    </div>
    <ChatIcon
      v-if="platform !== 'H5'"
      v-show="!isShowWindow"
      :show-red-dot="showRedDot"
      :is-has-online-employee="isHasOnlineEmployee"
      @click="handleOpenChat"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, provide, onMounted, computed, PropType } from 'vue'
  import { Message, MessageBox } from 'element-ui'
  import { buildUuid } from '@jlc/utils'
  import ChatIcon from './components/ChatIcon.vue'
  import ChatBusinessSelect from './components/ChatBusinessSelect.vue'
  import ChatHeader from './components/ChatHeader.vue'
  import ChatTime from './components/ChatTime.vue'
  import ChatContainer from './components/ChatContainer.vue'
  import ChatFooter from './components/ChatFooter.vue'
  import ChatLoading from './components/ChatLoading.vue'
  import ChatItem from './components/ChatItem.vue'
  import ChatPopup from './components/ChatPopup.vue'
  import IntelligenticonDialog from './components/IntelligenticonDialog.vue'
  import IntelligenticonContent from './components/IntelligenticonContent.vue'
  import CloseTheChatContent from './components/CloseTheChatContent.vue'
  import MessageGuide from './components/MessageGuide.vue'
  import ChatTips from './components/ChatTips.vue'
  import TranscriptModal from './components/TranscriptModal.vue'
  import TranscriptContent from './components/TranscriptContent.vue'
  import Popup from './components/Popup.vue'
  import ChatRateService from './components/ChatRateService.vue'
  import ImDialog from './components/ImDialog.vue'
  import contactUs from './components/contact/index.vue'
  import useHooks from './utils/useHook'
  import { imFileDownloadFile, imFileUploadFile, getConfigValueList } from '#shared/apis'
  import { IPlatformType } from '#shared/utils/imMessage'
  const props = defineProps({
    lang: {
      type: String,
      default: 'en'
    },
    platform: {
      type: String as PropType<IPlatformType>,
      default: 'PC'
    }
  })
  const isShowTip = ref(false)
  const chatTipMessage = ref('')
  let chatTipTimer: any = null
  const isMobile = ref(false)
  const uploadElemRef = ref()
  const isDetailExtend = ref(false)
  // 是否展示头部的更多按钮
  const showMoreBtn = computed(() => {
    return chatStep.value === 'chat' && msgs.value.length > 0
  })

  const showTip = (message: string) => {
    chatTipMessage.value = message
    isShowTip.value = true
    clearTimeout(chatTipTimer)
    chatTipTimer = setTimeout(() => {
      isShowTip.value = false
    }, 3000)
  }
  const fileListSelectedArr = computed(() => {
    return fileList.value.filter((item) => item.selected)
  })
  const fileUploadSuccessLen = computed(() => {
    return fileList.value.filter((item) => item.uploadStatus === 'success')
  })
  const uploadConfig = ref({
    maxLimit: 20,
    limitSize: 50, // 50M
    accept: [
      '.jpg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.bmp',
      '.mp4',
      '.webm',
      '.ogg',
      '.MP2T',
      '.3gpp',
      '.zip'
    ] as string[]
  })

  // 获取配置信息列表
  const getBaseConfigValueList = () => {
    if (process.client) {
      getConfigValueList(['SYSTEM.overseas_im_system_config.im_upload_file_type_limit'], { shipHandle: true }).then(
        (result) => {
          if (result.code === 200) {
            // 获取配置
            uploadConfig.value.accept = (
              result.data['SYSTEM.overseas_im_system_config.im_upload_file_type_limit'] || ''
            ).split(',')
          }
        }
      )
    }
  }

  const handleDragOver = () => {
    if (isDragging.value) return
    if (chatStep.value === 'chat') {
      isDragging.value = true
    } else {
      isDragging.value = false
    }
  }
  const handleDragLeave = (e: any) => {
    if (e.relatedTarget?.dataset?.drag && ['dragTag'].includes(e.relatedTarget.dataset.drag)) return
    isDragging.value = false
  }
  // 文件拖拽松手后
  const handleDrop = (event: any) => {
    const files = event.dataTransfer.files || []
    const newFileArr = []
    isDragging.value = false
    if (validateUploadFiles(files)) {
      for (let i = 0; i < files.length; i++) {
        const obj = {
          file: files[i],
          id: buildUuid(),
          selected: false
        }
        newFileArr.push(obj)
      }
    }
    // console.log(files)
    uploadFiles(newFileArr)
  }
  // 上传=>校验=>调接口上传
  const uploadFiles = (files: any[]) => {
    // 处理文件上传
    const errorFiles = []
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i]
      validateFile(fileItem)

      if (fileItem.isValid) {
        if (!fileList.value.length || fileList.value.findIndex((item) => item.id === fileItem.id) === -1) {
          fileList.value.push(fileItem)
        }

        uploadReq(fileItem)
        // 开启 loading 效果
      } else {
        // 校验不通过的文件将会收集起来统一提示
        errorFiles.push(fileItem)
      }
    }

    if (errorFiles.length) {
      showFileErrorTips(errorFiles)
    }
  }
  // 调用上传接口
  const uploadReq = (fileItem: any) => {
    try {
      const form = new FormData()
      form.append('file', fileItem.file)
      form.append('fileType', 'imAttachFile')

      imFileUploadFile(form, {
        json2form: true,
        shipHandle: true,
        timeout: 300000,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const index = fileList.value.findIndex((item) => item.id === fileItem.id)
          // 进度
          const percent = (progressEvent.loaded / progressEvent.total) * 20 || 0
          const progressPercentage = parseInt(percent.toFixed(0))
          if (progressPercentage >= 98) {
            fileList.value[index].percentage = 98 // 进度
          } else {
            fileList.value[index].percentage = progressPercentage // 进度
          }
          fileList.value[index].uploadStatus = 'loading'
        }
      })
        .then((res) => {
          const index = fileList.value.findIndex((item) => item.id === fileItem.id)
          if (res && res.code === 200) {
            fileList.value[index].percentage = 100
            fileList.value[index].uploadStatus = 'success'
            fileList.value[index].selected = true
            const fileUrl = imFileDownloadFile(res.data.fileIndexId)
            fileList.value[index].fileUrl = fileUrl
          } else {
            fileList.value.splice(index, 1)
            Message({
              message: 'Upload Failed, please try again. ',
              type: 'error'
            })
          }
        })
        .catch(() => {
          const index = fileList.value.findIndex((item) => item.id === fileItem.id)
          fileList.value.splice(index, 1)
          Message({
            message: 'Upload Failed, please try again. ',
            type: 'error'
          })
        })
        .finally(() => {
          // 上传后需要关注一下非拖拽上传input 的value值需要清空下
          ChatFooterRef.uploadElem.value!.value = ''
        })
    } catch (err) {
      console.log(234, err)
    }
  }
  // 处理文件名超出
  const nameWithoutExtension = (fileName: string, maxLen = 14) => {
    const extension = fileName.split('.').pop() // 获取文件后缀
    const nameWithoutExtension = fileName.substr(0, fileName.lastIndexOf('.')) // 获取不带后缀的文件名
    let result = ''
    if (nameWithoutExtension.length > maxLen) {
      const truncatedName =
        nameWithoutExtension.substring(0, Math.floor(maxLen / 2)) +
        '...' +
        nameWithoutExtension.substr(-Math.floor(maxLen / 2) - 3, Math.floor(maxLen / 2) - 3)
      result = truncatedName + '.' + extension
    } else {
      result = fileName
    }
    return result
  }
  // 校验文件数量是否超出
  const validateUploadFiles = (files: any) => {
    if (files.length > uploadConfig.value.maxLimit - fileList.value.length) {
      Message({
        message: 'Cannot upload more than 20 files at a time',
        type: 'error'
      })
      return false
    }
    return true
  }
  // 校验文件是否符合上传标准
  const validateFile = (fileItem: any) => {
    const { size, type, name } = fileItem.file
    const fileExtension = name.substring(name.lastIndexOf('.')).toLowerCase()
    if (size / 1024 / 1024 > uploadConfig.value.limitSize) {
      // this.$refs.uploadElem.value = ''
      fileItem.isValid = false
      fileItem.errorTip = `【${nameWithoutExtension(name)}】 Cannot upload a file over 50MB.`
      return false
    }

    if (
      !uploadConfig.value.accept.length ||
      (fileExtension && uploadConfig.value.accept.length && !uploadConfig.value.accept.includes(fileExtension)) ||
      !fileExtension
    ) {
      // this.$refs.uploadElem.value = ''
      fileItem.isValid = false
      fileItem.errorTip = `【${nameWithoutExtension(name)}】 file type is not supported.`
      return false
    }
    fileItem.isValid = true
    fileItem.uploadStatus = 'loading'
    fileItem.percentage = 1
    return true
  }
  // 错误提示集合
  const showFileErrorTips = (errorFiles: any[]) => {
    let htmlStr = ``
    errorFiles.forEach((item) => {
      htmlStr += `<div style="margin-bottom:5px">${item.errorTip}</div>`
    })
    MessageBox({
      title: 'tips',
      message: htmlStr,
      confirmButtonText: 'ok',
      dangerouslyUseHTMLString: true
    })
  }

  const handleFileSelect = (event: any) => {
    const files = event.target.files || []
    const newFileArr = []
    if (validateUploadFiles(files)) {
      for (let i = 0; i < files.length; i++) {
        const obj = {
          file: files[i],
          id: buildUuid(),
          selected: false
        }
        newFileArr.push(obj)
      }
    }
    uploadFiles(newFileArr)
  }

  const getFileTypeIcon = (filename: any) => {
    if (!filename) return ''
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']

    const extension = filename.split('.').pop().toLowerCase()

    if (imageExtensions.includes(extension)) {
      return 'file_img' // 图片图标
    } else if (videoExtensions.includes(extension)) {
      return 'file_video' // 视频图标
    } else if (archiveExtensions.includes(extension)) {
      return 'folder_zip' // 压缩包图标
    } else {
      return 'file_icon' // 未知文件类型图标
    }
  }

  // 点击发送文件
  const sendFile = () => {
    if (fileListSelectedArr.value.length) {
      fileListSelectedArr.value.forEach((item) => {
        const param = {
          fileUrl: item.fileUrl || '',
          type: item.file.type,
          name: item.file.name
        }
        handleUploadFile(param)
        delFile(item.id)
      })
    }
  }
  // 删除文件
  const delFile = (id: string) => {
    const index = fileList.value.findIndex((item) => item.id === id)
    fileList.value.splice(index, 1)
  }

  // 复制上传
  const handlePaste = (event: any) => {
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        const param = {
          target: {
            files: [file]
          }
        }
        handleFileSelect(param)
      }
    }
  }

  // 留言完
  const onLeaveMessage = (t: Number) => {
    // 1，排队中的将退出排队，回到业务线选择界面
    isShowMessageModal.value = false
    isShowWaitingMessage.value = false
    if (t) {
      handleOnlyCloseChat(true)
    }
  }

  getBaseConfigValueList()
  provide('getLang', () => props.lang)
  provide('showTip', showTip)

  onMounted(() => {
    isMobile.value = window.innerWidth < 720
  })

  const {
    isCloseTheChat, // 是否关闭工单
    isHasOnlineEmployee, // 是否有客服在线
    chatStep, // 聊天窗口当前操作步骤
    isShowLoading, // 加载效果
    isShowWindow, // 是否显示聊天窗口
    currentBusiness, // 当前选择的业务类型
    isCanScrollToTop, // 是否能向上滚动
    ChatFooterRef,
    chatContainerRef,
    orderListRef,
    isShowIntelligenticon, // 是否显示智能联想弹框
    isStartIntelligenticon, // 是否开启智能联想
    tipMsg, // 打开弹框时的提示信息
    msgs, // 排序后的消息列表
    isShowOrderPopup,
    sceneCode,
    fileList,
    isDragging,
    bindEmail,
    showRedDot,
    transcriptChatRecordModal,
    isShowH5RateService,
    isShowMessageModal,
    isShowWaitingMessage,
    isQueuing,
    isTransferEmailCloseFlag,
    transferEmailCloseCountDown,
    quoteMsg,
    historyFlag,
    closeTransferEmailTipModal,
    handleIntelligenticonChange, // 智能联想开关
    handleSelectBusiness, // 选择业务线
    handleIntelligenticon, // 智能联想
    handleSendFaqMessage, // 发送 FAQ
    handleSubmitEvaluation, // 发送评价
    handleTextMessage, // 发送文本消息
    handleRateService, // 显示评价弹框
    handleLoadPreMsgs, // 加载历史消息
    handleOpenChat, // 打开聊天框
    handleRevoke, // 消息撤回
    handleResend, // 重新发送撤回的消息
    handleWinMin, // 最小化
    handleWinClose, // 关闭
    handleSendOrder, // 显示订单列表
    handleStartChat,
    handleUploadFile,
    handleCloseChat,
    handleOnlyCloseChat,
    initImStatus,
    handleSendTranscript,
    openImChatByFa, // fa 询价场景：打开im并留言
    openImChatReply, // 用户中心站内信回复场景
    setBindEmail,
    handleQuoteMsg,
    handleViewHistory,
    handleBackSelBusiness
  } = useHooks(props, uploadConfig.value)

  defineExpose({ openImChatByFa, openImChatReply, openChat: handleOpenChat })
</script>

<style lang="scss" scoped>
  .v-enter-active,
  .v-leave-active {
    transition: opacity 0.5s ease;
  }

  .v-enter-from,
  .v-leave-to {
    opacity: 0;
  }

  .chat-window-bg {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 200px;
    background-image: url('./imgs/bg.png');
    background-size: 100%;
    // background-position: -20px -20px;
  }

  .chat-window-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
  }
  .chat-window {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    background: linear-gradient(180deg, #c1e1ff 0%, #f1f4f9 20%);
    overflow: hidden;
  }

  .no-employee {
    background: linear-gradient(180deg, #c1e1ff 0%, #fff 20%);
  }

  .wm-chat-inside {
    // position: fixed;
    // right: 0px;
    // bottom: 0px;
    font-size: 14px;
    // z-index: 1202;
    height: 100%;
  }

  .chat-container {
    position: relative;
    margin-top: 10px;
    flex: 1;
    overflow: auto;
    // padding: 0 12px;
    overflow: auto;
  }

  .drop-dialog-modal {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

    .drop-dialog-box {
      width: 100%;
      height: 100%;
      .drop-dialog-box-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
    }
  }
  .drop-dialog {
    position: absolute;
    left: 10px;
    top: 60px;
    z-index: 2;
    width: 353px;
    height: 650px;
    background: #ffffff;
    border-radius: 8px;

    font-size: 20px;
    font-weight: 600;
    color: #1871ff;
    z-index: 999;
    padding: 11px;
    .drop-dialog-title {
      font-size: 13px;
      font-weight: 400;
      color: #000000;
      line-height: 17px;
      margin-bottom: 10px;
    }
    .drop-dialog-content {
      width: 331px;
      height: 600px;
      border: 1px dashed #2b8ced;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      color: #2b8ced;
    }

    .upload-icon {
      font-size: 18px;
      margin-right: 6px;
    }
  }
  .uploadFileBox {
    background-color: #fff;
    width: 351px;
    background: #ffffff;
    border-radius: 8px;
    padding: 10px;
    transition: all 0.15s ease-in-out;
    margin: 0 auto;
    .fileList {
      max-height: 240px;
      overflow-y: auto;
      .fileItemBox {
        margin-bottom: 10px;
      }
      .fileItem {
        height: 40px;
        background: #f1f3f5;
        border-radius: 4px;
        display: flex;
        align-items: center;
        padding: 0 4px 0 8px;

        cursor: pointer;
        .fileName {
          flex: 1;
          color: #000;
          font-size: 13px;
        }
      }
    }
  }
  .uploadFileBoxExtend {
    height: auto;
  }
  .send-file-btn {
    width: 331px;
    height: 38px;
    background: #2b8ced;
    border-radius: 8px;
    font-size: 14px;
  }
  .chat-img-loading {
    color: #2b8ced;
    font-size: 18px;
  }
  .leave-tips {
    font-size: 14px;
    font-weight: 400;
    color: #222222;
    margin-bottom: 16px;
  }
  .queue-message-btn,
  .queue-waiting-btn {
    font-size: 14px;
    font-weight: 600;
  }
  .queue-message-btn {
    border-color: #2b8ced;
    margin-right: 12px;
    color: #2b8ced;
    width: 146px;
  }
  .chat-business-footer,
  .chat-footer {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    display: flex;
  }

  .chat-business-footer {
    height: 82px;
    background-color: #fff;
    justify-content: center;
    align-items: center;

    .chat-business-footer-btn {
      width: 343px;
    }
  }
</style>
