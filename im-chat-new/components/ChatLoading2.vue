<template>
  <div class="hourglass" :style="{ width, height }">
    <div class="top-line"></div>
    <div class="bottom-line"></div>
    <div class="sand-top"></div>
    <div class="sand-bottom"></div>
    <div class="line-1 line"></div>
    <div class="line-2 line"></div>
    <div class="line-3 line"></div>
    <div class="line-4 line"></div>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    width: {
      type: String,
      default: '12px'
    },
    height: {
      type: String,
      default: '16px'
    }
  })
</script>

<style scoped>
  /* 沙漏外壳 */
  .hourglass {
    display: inline-block;
    position: relative;
    width: 12px;
    height: 16px;
    overflow: hidden;
    animation: flip 4s infinite;
    transform-origin: center;
  }

  /* 上下部分的沙子容器 */
  .sand-top,
  .sand-bottom {
    position: absolute;
    left: 50%;
    width: 58%;
    background: #2b8ced;
    transform: translateX(-50%);
  }

  /* 上半部的沙子，三角形向下 */
  .sand-top {
    top: 5%;
    height: 45%;
    clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
    animation: sand-top-drain 4s infinite;
  }

  /* 下半部的沙子，三角形向上 */
  .sand-bottom {
    bottom: 5%;
    height: 0;
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    animation: sand-bottom-fill 4s infinite;
  }

  /* 上半部沙子的流失动画，逐渐缩小并向下移动 */
  @keyframes sand-top-drain {
    0% {
      height: 45%;
      top: 10%;
    }
    100% {
      height: 0;
      width: 0;
      top: 55%;
    }
  }

  /* 下半部沙子的填充动画，逐渐增大 */
  @keyframes sand-bottom-fill {
    0% {
      height: 0;
    }
    100% {
      height: 45%;
    }
  }

  /* 沙漏上下翻转动画 */
  @keyframes flip {
    0%,
    50% {
      transform: rotate(0deg);
    }
    51%,
    100% {
      transform: rotate(180deg);
    }
  }
  .top-line,
  .bottom-line {
    position: absolute;
    width: 120%;
    left: 50%;
    transform: translateX(-50%);
    border-top: 3px solid #2b8ced;
  }

  .top-line {
    top: 0;
  }

  .bottom-line {
    bottom: 0;
  }

  .line {
    position: absolute;
    width: 1px;
    height: 56%;
    border-left: 1px solid #2b8ced;
  }

  .line-1 {
    left: 12%;
    top: 0;
    transform-origin: top left;
    transform: rotate(-26deg);
  }

  .line-2 {
    left: 88%;
    top: 0;
    transform-origin: top left;
    transform: rotate(26deg);
  }

  .line-3 {
    left: 12%;
    bottom: 0px;
    transform-origin: bottom left;
    transform: rotate(26deg);
  }

  .line-4 {
    left: 88%;
    bottom: 0;
    transform-origin: bottom left;
    transform: rotate(-26deg);
  }
</style>
