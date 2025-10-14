<template>
  <div class="chat-video-item">
    <div class="chat-video-wrap im-video" @click="handleClick">
      <img src="../imgs/play.svg" class="im-video-play-icon" />
      <video class="im-video-element" :src="item.url" width="120px" height="120px" :type="item.contentType"></video>
    </div>
    <div v-if="isShowVideoDialog" class="im-video-dialog" @click.self="isShowVideoDialog = false">
      <i class="el-icon-close video-close-btn" @click.self="isShowVideoDialog = false"></i>
      <video class="im-video-body" :src="item.url" autoplay controls :type="item.contentType"></video>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from '#shared/utils'
  import { getMessages, IPlatformType } from '#shared/utils/imMessage'
  const route = useRoute()
  const platform = (route.query.platform as IPlatformType) || 'PC'
  const props = defineProps({
    item: {
      type: Object,
      required: true
    }
  })
  const isShowVideoDialog = ref(false)
  const handleClick = () => {
    if (platform === 'PC') {
      window.parent.postMessage(getMessages('openVideo', props.item), '*')
    } else {
      isShowVideoDialog.value = true
    }
  }
</script>

<style scoped lang="scss">
  .im-video-element {
    background-color: #000;
  }

  .im-video {
    position: relative;
    cursor: pointer;
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
  }

  .im-video-play-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .im-video-dialog {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 99;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;

    .video-close-btn {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 40px;
      height: 40px;
      font-size: 24px;
      color: #fff;
      cursor: pointer;
    }
  }

  .im-video-body {
    width: 70%;
    height: 70%;
  }

  .chat-video-item {
    margin-right: 12px;
    margin-left: 12px;
  }
</style>
