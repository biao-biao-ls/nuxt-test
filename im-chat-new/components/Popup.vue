<template>
  <div v-if="isVisible" class="popup-overlay" @click="closePopup">
    <div class="popup-content" :class="{ 'slide-down': isClosing }" @click.stop>
      <slot></slot>
      <img src="../imgs/win-close.svg" class="im-close-btn" @click="closePopup" />
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      isVisible: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        isClosing: false // 用于控制关闭动画
      }
    },

    methods: {
      closePopup() {
        this.isClosing = true // 触发关闭动画
        setTimeout(() => {
          this.$emit('close') // 动画结束后关闭弹窗
          this.isClosing = false
        }, 300) // 动画时长 300ms
      }
    }
  }
</script>

<style scoped>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
  }

  .popup-content {
    position: relative;
    background-color: white;
    width: 100%;
    max-width: 600px;
    padding: 20px;
    border-radius: 10px 10px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  /* 关闭时的动画 */
  @keyframes slideDown {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  /* 应用关闭动画 */
  .slide-down {
    animation: slideDown 0.3s ease-out;
  }

  .im-close-btn {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
  }
</style>
