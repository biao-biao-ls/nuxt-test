<template>
  <div
    class="chat-icon-wrapper"
    :class="{ active: isShowIcon, transparentBg: isHasOnlineEmployee && avatarUrl }"
    @click="$emit('click')"
  >
    <div v-if="isHasOnlineEmployee && avatarUrl" class="chat-avatar">
      <img :src="avatarUrl" alt="" class="chat-avatar-img" />
    </div>
    <div v-else class="chat-icon">
      <svg color="inherit" viewBox="0 0 32 32" class="">
        <path
          fill="#FFFDFD"
          d="M12.63,26.46H8.83a6.61,6.61,0,0,1-6.65-6.07,89.05,89.05,0,0,1,0-11.2A6.5,6.5,0,0,1,8.23,3.25a121.62,121.62,0,0,1,15.51,0A6.51,6.51,0,0,1,29.8,9.19a77.53,77.53,0,0,1,0,11.2,6.61,6.61,0,0,1-6.66,6.07H19.48L12.63,31V26.46"
        ></path>
        <path
          fill="#2B8CED"
          d="M19.57,21.68h3.67a2.08,2.08,0,0,0,2.11-1.81,89.86,89.86,0,0,0,0-10.38,1.9,1.9,0,0,0-1.84-1.74,113.15,113.15,0,0,0-15,0A1.9,1.9,0,0,0,6.71,9.49a74.92,74.92,0,0,0-.06,10.38,2,2,0,0,0,2.1,1.81h3.81V26.5Z"
          class="chat-icon-bg"
        ></path>
      </svg>
      <div class="dots">
        <svg viewBox="0 0 60 40" width="18px" fill="#2B8CED">
          <circle r="6" cy="20" cx="9" class="epoxe490"></circle>
          <circle r="6" cy="20" cx="30" class="epoxe490"></circle>
          <circle r="6" cy="20" cx="51" class="epoxe490"></circle>
        </svg>
      </div>
    </div>
    <div v-if="showRedDot" class="red-dot">
      <span></span>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useCustomerInfo } from '../utils/useCustomerInfo'
  const { avatarUrl } = useCustomerInfo()
  const isShowIcon = ref(false)

  defineProps({
    showRedDot: {
      type: Boolean,
      default: false
    },
    isHasOnlineEmployee: {
      type: Boolean,
      default: false
    }
  })

  onMounted(() => {
    isShowIcon.value = true
  })
</script>

<style>
  .chat-icon-popover {
    padding: 8px 12px !important;
    font-size: 16px;
    z-index: 1201 !important;
  }
</style>

<style lang="scss" scoped>
  .chat-wave-icon {
    vertical-align: -2px;
  }
  .chat-close-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 86px;
    &:hover {
      .chat-close-btn {
        display: flex;
      }
    }
  }
  .chat-close-btn {
    display: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    position: absolute;
    box-shadow: 0px 4px 8px 0px rgba(78, 122, 194, 0.24);
    justify-content: center;
    align-items: center;
    top: 0px;
    right: 0;
    font-size: 18px;
    cursor: pointer;
    background-color: #fff;
  }
  .chat-icon-btn {
    width: 100%;
  }
  .chat-icon-label {
    font-size: 16px;
    line-height: 30px;
  }
  .chat-icon-wrapper {
    display: flex;
    width: 60px;
    height: 60px;
    justify-content: center;
    align-items: center;
    overflow: visible;
    color: #111111;
    background-color: #2b8ced;
    cursor: pointer;

    .chat-icon {
      position: relative;
      transform-origin: center;
      width: 32px;
      height: 32px;
    }

    .dots {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: none;
    }

    &.active,
    &:hover {
      .chat-icon {
        transform: scale(1.05);
      }

      .dots {
        display: block;
      }

      .chat-icon-bg {
        fill: #fffdfd;
      }
    }
  }
  .red-dot {
    position: absolute;
    right: 7px;
    top: 10px;
    width: 14px;
    height: 14px;
    background: #ff2e62;
    border: 1px solid #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      display: inline-block;
      width: 4px;
      height: 4px;
      background: #ffffff;
      border-radius: 50%;
    }
  }
  .chat-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    overflow: hidden;
    .chat-avatar-img {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
  .transparentBg {
    background-color: transparent;
  }
</style>
