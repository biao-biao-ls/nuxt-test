<template>
  <div class="dots">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
</template>

<script>
  export default {
    name: 'PageLoading',
    props: {
      loadingText: {
        type: String,
        default: ''
      },
      type: {
        type: String,
        default: ''
      }
    }
  }
</script>

<style lang="scss" scoped>
  @keyframes dot-loading {
    0% {
      transform: scale(1);
      background-color: rgba(43, 140, 237, 1);
    }
    50% {
      transform: scale(1.5);
      background-color: rgba(43, 140, 237, 0.8);
    }
    100% {
      transform: scale(1);
      background-color: rgba(43, 140, 237, 1);
    }
  }

  .dots {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
  }

  .dot {
    background-color: rgba(43, 140, 237, 0.5);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin: 0 6px;

    &:nth-child(1),
    &:nth-child(3) {
      animation: dot-loading 1s infinite;
    }
    &:nth-child(2) {
      animation: dot-loading 1s infinite reverse;
      animation-delay: 200ms;
    }
  }
</style>
