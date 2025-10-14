<template>
  <el-image
    class="chat-image-item"
    :src="item.url"
    lazy
    :preview-src-list="imgList"
    fit="contain"
    @click.native="handleImgClick"
  >
    <div slot="placeholder" class="image-slot">
      <i class="el-icon-loading chat-img-loading"></i>
    </div>
    <img slot="error" src="#shared/assets/images/global/noImg.png" class="image-slot" />
  </el-image>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
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
  const imgList = computed(() => {
    if (platform === 'PC') {
      return []
    } else {
      return [props.item.url]
    }
  })

  const handleImgClick = () => {
    if (platform === 'PC') {
      window.parent.postMessage(getMessages('openImage', props.item.url), '*')
    }
  }
</script>

<style scoped lang="scss">
  .chat-img-loading {
    color: #2b8ced;
    font-size: 28px;
  }
  .image-slot {
    width: 120px;
    height: 120px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chat-image-item {
    max-width: 120px;
    max-height: 120px;
    background-color: rgba($color: #000000, $alpha: 0.35);
    border-radius: 8px;
    margin-right: 12px;
    margin-left: 12px;
  }
</style>
