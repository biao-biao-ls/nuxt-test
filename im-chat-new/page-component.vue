<template>
  <ImChat ref="ImChatRef" :platform="platform" :lang="lang" />
</template>

<script lang="ts">
  import { defineComponent, nextTick, ref, onMounted, onBeforeUnmount, provide } from 'vue'
  import { getMessages, parseMessage, IPlatformType } from '../../utils/imMessage'
  import { useRoute } from '../../utils'
  import ImChat from './chat.vue'
  import { selectMessageNoticeDetail } from '#shared/apis'

  export default defineComponent({
    name: 'IM',
    components: {
      ImChat
    },
    layout: 'empty',
    setup() {
      const route = useRoute()
      const platform = ref<IPlatformType>((route.query.platform as IPlatformType) || 'PC')
      const lang = ref('en') // 多语言
      const parentUrl = ref('') // 父窗口url
      provide('parentUrl', parentUrl)

      // 单独处理 app 打开回复的场景，需要请求请求业务接口
      const handleImChatReplyByH5 = async () => {
        const msgNoticeRecordAccessId = route.query.msgNoticeRecordAccessId as string
        if (platform.value === 'H5' && msgNoticeRecordAccessId && route.query.eventName === 'openImChatReply') {
          const formData = new FormData()
          formData.append('msgNoticeRecordAccessId', msgNoticeRecordAccessId)
          const res = await selectMessageNoticeDetail(formData)
          const replyData = {
            msgNoticeRecordAccessId, // IM 跳转回原消息时用
            msgMessageRecordAccessId: res.msgMessageRecordAccessId, // erp 获取消息详情时用
            orderType: res.orderType,
            msgTitle: res.messageTitle,
            msgContent: res.msgMessageDetailListVos?.[0].messageContent?.slice(0, 150) // 只截取一部分内容作为摘要即可
          }
          ImChatRef.value.openImChatReply(replyData)
        }
      }

      const ImChatRef = ref<any>(null)
      onMounted(() => {
        // document.body.style.minWidth = 'auto'
        // document.documentElement.style.minWidth = 'auto'
        // document.body.style.minHeight = 'auto'
        // document.documentElement.style.minHeight = 'auto'
        // document.body.style.height = '100%'
        // document.documentElement.style.height = '100%'
        // const nuxtDom = document.querySelector('#__nuxt') as HTMLDivElement
        // if (nuxtDom) {
        //   nuxtDom.style.height = '100%'
        // }
        // const layoutDom = document.querySelector('#__layout') as HTMLDivElement
        // if (layoutDom) {
        //   layoutDom.style.height = '100%'
        // }
        // const faContent = document.querySelector('.fa-content') as HTMLDivElement
        // if (faContent) {
        //   faContent.style.height = '100%'
        //   faContent.parentElement.style.height = '100%'
        // }
        nextTick(() => {
          // im 组件加载完成
          if (platform.value === 'PC') {
            window.parent.postMessage(getMessages('isImChatLoaded'), '*')
          } else if (platform.value === 'H5') {
            ImChatRef.value.openChat()
            window.parent.postMessage(getMessages('isImChatLoaded'), '*')
          }
        })

        // 单独处理 app 打开回复的场景
        handleImChatReplyByH5()

        // 监听来自父页面的消息
        window.addEventListener('message', (event) => {
          const message = parseMessage(event.data)
          switch (message.eventType) {
            case 'setLang':
              lang.value = message.data
              break
            case 'parentUrl':
              parentUrl.value = message.data
              break
            case 'openChat':
              ImChatRef.value.openChat()
              break
            case 'openImChatByFa':
              ImChatRef.value.openImChatByFa(message.data)
              break
            case 'openImChatReply':
              ImChatRef.value.openImChatReply(message.data)
              break
          }
        })
      })

      onBeforeUnmount(() => {
        // document.body.style.minWidth = ''
        // document.documentElement.style.minWidth = ''
        // document.body.style.minHeight = ''
        // document.documentElement.style.minHeight = ''
        // const faContent = document.querySelector('.fa-content') as HTMLDivElement
        // if (faContent) {
        //   faContent.style.height = ''
        //   faContent.parentElement.style.height = ''
        // }
      })
      return {
        lang,
        platform,
        ImChatRef
      }
    }
  })
</script>
