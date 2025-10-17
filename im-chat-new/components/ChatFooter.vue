<template>
  <div v-if="chatStep === 'business'" class="chat-business-footer">
    <el-button type="primary" class="chat-business-footer-btn" round :disabled="disabled" @click="$emit('start')">
      Start the chat
    </el-button>
  </div>
  <div
    v-else-if="chatStep === 'chat'"
    class="chat-footer"
    :class="{
      'chat-footer-h5': platform === 'H5',
      'min-h-[106px]': !isBackgroundClose && platform !== 'H5',
      'px-[0px]': isBackgroundClose
    }"
  >
    <!-- 再次发起聊天 -->
    <div v-if="isBackgroundClose" class="chat-business-footer">
      <el-button type="primary" class="chat-business-footer-btn" round @click="handleChatAgain()">
        Start the chat again
      </el-button>
    </div>

    <div
      v-if="!isBackgroundClose"
      class="chat-service-btns flex items-center justify-between"
      :class="{ 'mb-[30px]': isBackgroundClose }"
    >
      <div class="flex items-center justify-between">
        <div v-if="isLogin && !isBackgroundClose" class="chat-service-btn" @click="$emit('showOrder')">Send Order</div>
        <div
          v-if="isHasService && !isQueuing && !isCloseConversation && !isBackgroundClose"
          class="chat-service-btn"
          @click="$emit('rateService')"
        >
          Rate Service
        </div>
        <!-- 留言 -->
        <div v-if="isQueuing" class="chat-service-btn" @click="$emit('message')">message</div>
        <div v-if="platform === 'H5'" class="chat-service-btn" @click="$emit('close')">Close Chat</div>
      </div>
    </div>
    <!-- 引用 -->
    <div v-if="platform === 'H5' && quoteMsgText" class="flex items-center text-[#666] mb-[4px]">
      <div class="text-[14px] flex-1 truncate">{{ quoteMsgText }}</div>
      <i class="el-icon-error pl-[15px] text-[18px] text-[#999]" @click="clearQuoteMsg"></i>
    </div>
    <template v-if="!isBackgroundClose">
      <div class="rounded-[8px] bg-[#ffffff]">
        <!-- 引用 -->
        <div v-if="platform === 'PC' && quoteMsgText" class="flex items-center text-[#666] mt-[12px] px-[15px]">
          <i class="el-icon-error pr-[10px] text-[18px] text-[#999]" @click="clearQuoteMsg"></i>
          <div class="text-[14px] flex-1 truncate">{{ quoteMsgText }}</div>
        </div>
        <div class="chat-reply-container">
          <div v-if="platform === 'H5'" class="chat-reply-btns" @click="handleToggleEmoji">
            <svg-icon
              class="cursor-pointer pr-8"
              :name="isShowH5Emoji ? 'chat_jianpan_icon' : 'chat_emoji_icon'"
              width="28px"
              height="28px"
            />
          </div>
          <div class="chat-reply-input-container" @paste="$emit('paste', $event)" @keydown="handleKeydown">
            <el-autocomplete
              v-if="isStartIntelligenticon"
              ref="autoTextRef"
              v-model="message"
              :fetch-suggestions="querySearchAsync"
              :trigger-on-focus="false"
              placeholder="Type a message"
              class="chat-reply-input"
              :class="{ h5: platform !== 'PC' }"
              :popper-class="'show-autocomplete-popper'"
              @select="handleSelect"
              @keydown.native="handleBackspace"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
            ></el-autocomplete>
            <el-input
              v-else
              ref="textInputRef"
              v-model="message"
              class="chat-reply-input"
              :class="{ h5: platform !== 'PC' }"
              :rows="1"
              resize="none"
              type="textarea"
              placeholder="Type a message"
              @keydown.native="handleBackspace"
              @focus="handleInputFocus"
              @blur="handleInputBlur"
            />
          </div>
          <div class="chat-reply-btns">
            <el-popover
              v-if="platform === 'PC'"
              placement="top-end"
              width="260"
              trigger="hover"
              class="chat-more-btn"
              popper-class="chat-emoji-popover"
            >
              <div class="max-h-[200px] overflow-auto flex flex-wrap" style="gap: 10px">
                <div v-for="(item, key) in emojiArr" :key="key" class="cursor-pointer" @click="handleChooseEmoji(key)">
                  <img :src="item" class="align-middle emoji-img" width="30px" height="30px" :title="key" />
                </div>
              </div>

              <svg-icon slot="reference" class="cursor-pointer" name="chat_emoji_icon" width="20px" height="20px" />
            </el-popover>
            <el-popover
              v-if="platform === 'PC'"
              popper-class="chat-upload-popover"
              placement="top"
              width="173"
              trigger="hover"
              class="chat-more-btn"
            >
              <svg-icon slot="reference" name="chat_Upload_icon" width="20px" height="20px" />
              <ul class="list-none chat-upload-items">
                <li class="chat-upload-item" @click="handleUpload">
                  <svg-icon name="chat_file_icon" width="20px" height="20px" />
                  <span class="chat-upload-label">Attach a file</span>
                </li>
                <li class="chat-upload-item" @click="handleIntelligenticon">
                  <svg-icon name="chat_intelligenticon" width="20px" height="20px" />
                  <span class="chat-upload-label">Smart Suggestions</span>
                </li>
              </ul>
            </el-popover>
            <span v-else-if="platform === 'H5'" class="ml-8" @click="handleToggleActions">
              <svg-icon :name="isShowH5Actions ? 'chat_guabi' : 'chat_Upload_icon'" width="28px" height="28px" />
            </span>
            <svg-icon
              v-show="platform === 'PC' || (platform === 'H5' && isInputFocus)"
              class="chat-reply-btn chat-reply-icon"
              :class="{ active: !!message.trim() }"
              name="Vector"
              :width="`${platform === 'PC' ? 20 : 28}px`"
              :height="`${platform === 'PC' ? 20 : 28}px`"
              @click.native="handleInputEnter"
            />
          </div>
        </div>
      </div>
      <!-- h5 表情 -->
      <div
        v-if="platform === 'H5' && isShowH5Emoji"
        class="max-h-[200px] overflow-auto flex flex-wrap py-12"
        :class="`emoji-gap-${platform}`"
      >
        <div v-for="(item, key) in emojiArr" :key="key" class="cursor-pointer" @click="handleChooseEmoji(key)">
          <img :src="item" class="align-middle emoji-img" width="30px" height="30px" :title="key" />
        </div>
      </div>
      <!-- h5 端的操作 -->
      <div v-if="platform === 'H5' && isShowH5Actions" class="chat-actions-h5">
        <div class="chat-action-item" @click="handleUpload">
          <svg-icon name="chat_file_icon" width="32" height="32" />
          <span class="chat-action-label">File</span>
        </div>
        <div class="chat-action-item" @click="handleIntelligenticon">
          <svg-icon name="chat_intelligenticon" width="32" height="32" />
          <span class="chat-action-label">Smart Suggestions</span>
        </div>
        <div class="chat-action-item" @click="$emit('openSendTranscript')">
          <svg-icon name="chat-icon-youjian" width="32" height="32" />
          <span class="chat-action-label">Send transcript</span>
        </div>
      </div>
    </template>

    <input ref="uploadElem" :accept="uploadConfig.accept.join(',')" type="file" multiple hidden @change="selectFile" />
  </div>
</template>

<script setup lang="ts">
  import { PropType, ref, toRefs, inject, nextTick, computed } from 'vue'
  import { ChatStep } from '../types'
  import { emojiArr } from '../utils'
  import { imFileDownloadFile, imFileUploadFile, faqAssociationAssociate } from '#shared/apis'
  import { useIsLogin } from '#shared/hooks'
  import { IPlatformType } from '#shared/utils/imMessage'
  const textInputRef = ref(null)
  const autoTextRef = ref(null)
  const showTip: any = inject('showTip')
  const isHasService: any = inject('isHasService')
  const isCloseConversation: any = inject('isCloseConversation')
  const isBackgroundClose: any = inject('isBackgroundClose')
  const handleChatAgain: any = inject('handleChatAgain')
  const getQuoteMsgText: any = inject('getQuoteMsgText')
  const clearQuoteMsg: any = inject('clearQuoteMsg')
  const isHasSuggestions = ref(false)
  const isLogin = useIsLogin()
  const uploadElem = ref<HTMLInputElement | null>(null)
  const emit = defineEmits([
    'sendMessage',
    'start',
    'showOrder',
    'rateService',
    'uploadFile',
    'intelligenticon',
    'sendIntelligenticon',
    'sendFaqMessage',
    'selectFile',
    'paste'
  ])
  const props = defineProps({
    disabled: {
      type: Boolean,
      deault: true
    },
    chatStep: {
      type: String as PropType<ChatStep>,
      required: true
    },
    isStartIntelligenticon: {
      type: Boolean,
      default: false
    },
    uploadConfig: {
      type: Object,
      default() {
        return {
          limitSize: 50, // 50M
          accept: [] as string[]
        }
      }
    },
    platform: {
      type: String as PropType<IPlatformType>,
      default: 'PC'
    },
    isQueuing: {
      type: Boolean,
      default: false
    },
    quoteMsg: {
      type: Object as any,
      default() {
        return {}
      }
    }
  })
  const { uploadConfig } = toRefs(props)

  const message = ref('')

  const isShowH5Actions = ref(false)
  const isShowH5Emoji = ref(false)
  const isInputFocus = ref(false)
  // 切换 H5 端的 Emoji
  const handleToggleEmoji = () => {
    isShowH5Emoji.value = !isShowH5Emoji.value
    isShowH5Actions.value = false
  }
  // 切换 H5 端的操作
  const handleToggleActions = () => {
    isShowH5Actions.value = !isShowH5Actions.value
    isShowH5Emoji.value = false
  }
  // 输入框聚焦
  const handleInputFocus = () => {
    isShowH5Emoji.value = false
    isShowH5Actions.value = false
    isInputFocus.value = true
  }
  // 输入框失去焦点
  const handleInputBlur = () => {
    setTimeout(() => {
      isInputFocus.value = false
    }, 10)
  }

  // 远程联想
  async function querySearchAsync(queryString: string, cb: any) {
    if (!queryString.trim()) {
      isHasSuggestions.value = false
      return cb()
    }
    try {
      const res = await faqAssociationAssociate({ label: queryString })
      isHasSuggestions.value = !!(Array.isArray(res) && res.length)
      const list = res
        ? res.map((item: any) => {
            return {
              value: item.title,
              accessId: item.accessId
            }
          })
        : []
      cb(list)
    } catch (err) {
      console.log(err)
      isHasSuggestions.value = false
      cb()
    }
  }

  // 选择联想内容
  const handleSelect = (item: any) => {
    emit('sendFaqMessage', item)
    message.value = ''
  }

  // 发送消息
  const handleInputEnter = () => {
    if (message.value.trim()) {
      emit('sendMessage', message.value)
    }
    message.value = ''
  }

  // 快捷删除表情代码
  const handleBackspace = (event: any) => {
    if (event.key === 'Backspace') {
      const cursorPosition = event.target.selectionStart
      const textBeforeCursor = message.value.substring(0, cursorPosition)
      const emojiPattern = /\[emoji::\w+\]$/
      const match = textBeforeCursor.match(emojiPattern)

      if (match) {
        // 阻止默认的退格键操作
        event.preventDefault()
        // 计算新的光标位置
        const newCursorPosition = cursorPosition - match[0].length

        // 移除匹配的表情符号代码
        message.value = textBeforeCursor.slice(0, -match[0].length) + message.value.substring(cursorPosition)

        // 设置光标位置
        nextTick(() => {
          event.target.setSelectionRange(newCursorPosition, newCursorPosition)
        })
      }
    }
  }

  // 上传文件
  const handleUpload = () => {
    uploadElem.value?.click()
  }

  // 智能联想
  const handleIntelligenticon = () => {
    emit('intelligenticon')
  }

  // {
  //         "bizType":"-1",
  //         "content":{
  //           "msgType": 1,
  //         }
  //       }

  // 文件上传前回调
  const beforeFileUpload = async (e: Event) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (file) {
      const { size, type, name } = file
      const fileExtension = name.substring(name.lastIndexOf('.')).toLowerCase()

      if (size / 1024 / 1024 > uploadConfig.value.limitSize) {
        uploadElem.value!.value = ''
        return showTip(`Cannot upload a file over ${uploadConfig.value.limitSize}MB`)
      }
      if (
        (fileExtension && uploadConfig.value.accept.length && !uploadConfig.value.accept.includes(fileExtension)) ||
        !fileExtension
      ) {
        uploadElem.value!.value = ''
        return showTip(`The file type is not supported`)
      }
      if (process.env.mode === 'local') {
        let url = ''
        switch (true) {
          case type.startsWith('image'):
            url =
              'https://images.pexels.com/photos/13032608/pexels-photo-13032608.jpeg?auto=compress&cs=tinysrgb&w=400&lazy=load'
            break
          case type.startsWith('video'):
            url = '/12438260_2560_1440_24fps.mp4'
            break
          case uploadConfig.value.accept.includes(fileExtension):
            url = name
            break
        }
        emit('uploadFile', { fileUrl: url, type, name })
        return
      }

      // 开启 loading 效果
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('fileType', 'imAttachFile')
        const data = await imFileUploadFile(form, { json2form: true })
        const fileUrl = imFileDownloadFile(data.fileIndexId)
        emit('uploadFile', { fileUrl, type, name })
      } catch (err) {
        showTip('Upload failed !')
      } finally {
        uploadElem.value!.value = ''
        // 关闭 loadding
      }
    }
  }
  const selectFile = (e) => {
    emit('selectFile', e)
  }

  // 选择表情包
  const handleChooseEmoji = (key: string) => {
    message.value += `${key}`
    nextTick(() => {
      if (textInputRef.value) {
        textInputRef.value.focus()
      } else if (autoTextRef.value) {
        autoTextRef.value.focus()
      }
    })
  }

  const handleKeydown = (event: any) => {
    if (event.key === 'Enter') {
      if (event.ctrlKey) {
        message.value += '\n'
      } else if (event.shiftKey) {
        // 如果同时按下了 Shift 键，插入换行符
      } else {
        // 否则，发送消息
        event.preventDefault() // 阻止默认的 Enter 行为
        handleInputEnter()
      }
    }
  }

  const quoteMsgText = computed(() => {
    if (!props.quoteMsg.serverExtension || !Object.keys(props.quoteMsg.serverExtension).length) {
      return false
    }
    const text = getQuoteMsgText(props.quoteMsg)
    const itemIsSelf = props.quoteMsg.isSelf

    let str = ''
    if (itemIsSelf) {
      str = 'Me: ' + text
    } else {
      str = (props.quoteMsg?.serverExtension?.ena ?? '-') + ': ' + text
    }
    return str.length > 100 ? str.substring(0, 100) + '...' : str
  })

  defineExpose({ message })
</script>

<style lang="scss">
  .chat-reply-icon {
    color: #bbb;
  }
  .show-autocomplete-popper {
    width: 345px !important;
    transform: translateY(10px);
    border: 1px solid #e6eaf1;
    border-radius: 8px;
    .el-scrollbar {
      .el-autocomplete-suggestion__wrap.el-scrollbar__wrap .el-scrollbar__view.el-autocomplete-suggestion__list {
        .el-icon-loading {
          color: #2b8ced;
          font-family: 'iconfont' !important;

          &:before {
            content: '\e7f1';
          }
        }
      }
    }

    &.el-autocomplete-suggestion.is-loading {
      li {
        height: 50px;
        line-height: 50px;
      }
    }
    .popper__arrow {
      display: none !important;
    }
  }

  .chat-upload-popover {
    // left: 315px !important;
    transform: translate(-26px, 3px);
    padding: 10px;

    .popper__arrow {
      left: 110px !important;
    }
  }
  .chat-emoji-popover {
    transform: translateX(5px);
  }
</style>

<style lang="scss" scoped>
  .chat-actions-h5 {
    display: flex;
    .chat-action-item {
      color: #666;
      box-sizing: content-box;
      width: 64px;
      display: flex;
      flex-direction: column;
      // justify-content: center;
      align-items: center;
      padding: 12px 15px;
      text-align: center;
      &:first-child {
        padding-left: 3px;
      }
      &:last-child {
        padding-right: 3px;
      }
      .chat-action-label {
        margin-top: 8px;
        font-size: 12px;
      }
    }
  }
  .emoji-gap-H5 {
    gap: 32px;
  }
  .chat-reply-input-container {
    flex: 1;
  }
  .chat-footer.chat-footer-h5 {
    height: auto;
    background-color: #fff;
    .chat-reply-container {
      padding: 8px 0;
    }
    .chat-service-btn {
      font-size: 12px;
      border: 1px solid #dbdbdb;
      border-radius: 24px;
    }

    .chat-reply-input {
      width: 100%;
      :deep(.el-textarea__inner) {
        outline: none;
        border: none;
        border-radius: 8px;
        padding: 6.5px 10px;
        background: #eeeeee;
        min-height: 34px;
      }

      :deep(.el-input__inner) {
        outline: none;
        border: none;
        border-radius: 8px;
        height: 34px;
        color: #222;
        background: #eeeeee;
      }

      &.h5 :deep(.el-input__inner) {
        height: 38px;
      }
      &.h5 :deep(.el-textarea__inner) {
        height: 38px;
      }
    }

    .chat-reply-btn,
    .chat-more-btn {
      margin-bottom: 0;
    }

    .chat-reply-btns {
      width: auto;
      padding: 0;
      align-items: center;
      .chat-reply-icon {
        margin-bottom: 5px;
      }
    }
  }
  .chat-upload-label {
    font-size: 14px;
    margin-left: 8px;
  }

  .chat-upload-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      color: #2b8ced;
    }
  }

  .chat-service-btns {
    display: flex;
    margin-bottom: 8px;
    margin-top: 10px;
  }

  .chat-service-btn {
    padding: 4px 8px;
    background-color: #fff;
    cursor: pointer;
    display: inline-block;
    border-radius: 8px;

    &:not(:first-child) {
      margin-left: 8px;
    }

    &:hover {
      color: #2b8ced;
    }
  }

  .chat-hidden-message {
    position: absolute;
    left: -10000px;
  }

  .chat-reply-input {
    :deep(.el-textarea__inner) {
      outline: none;
      border: none;
      border-radius: 8px;
      padding: 15px;
    }

    :deep(.el-input__inner) {
      outline: none;
      border: none;
      border-radius: 8px;
      height: 51px;
      color: #222;
    }
  }

  .chat-reply-btns {
    padding: 0 5px;
    width: 105px;
    display: flex;
    align-items: flex-end;
  }

  .chat-reply-btn,
  .chat-more-btn {
    margin-bottom: 15px;
    cursor: pointer;

    &.chat-reply-icon {
      cursor: not-allowed;
    }

    &:not(:first-child) {
      margin-left: 5px;
    }

    &:not(.chat-reply-icon):hover,
    &.active {
      color: #2b8ced;
      cursor: pointer;
    }
  }

  .chat-more-btn {
    margin-bottom: 12px;
    margin-left: 6px;
  }

  .chat-footer {
    padding: 0 12px;
    flex-direction: column;
  }

  .chat-reply-container {
    width: 100%;
    background-color: #fff;
    display: flex;

    border-radius: 8px;
  }

  .chat-business-footer,
  .chat-footer {
    // position: absolute;
    // left: 0;
    // bottom: 0;
    // width: 100%;
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
  .chat-again {
    width: 154px;
    height: 34px;
    background: #2b8ced;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 400;
    color: #ffffff;
    line-height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
</style>
