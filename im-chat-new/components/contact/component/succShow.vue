<template>
  <div class="text-center">
    <svg-icon name="24gf-envelopeCheck" width="40px" height="34px"></svg-icon>
    <p class="mt-20 text-[24px] font-bold">Thanks for getting in touch with us!</p>
    <p class="mt-14 text-14">Your message has been successfully submitted.</p>
    <p class="mt-30 text-14 text-999999">
      A member of our support staff will respond as soon as possible. Expect a reply between Mon-Fri: 24 hours, Sat:
      9am-6pm, GMT+8.
    </p>
    <nuxt-link :to="$getJumpLink('/')" class="inline-block mt-50 text-16 text-2B8CED hover:underline no-underline">
      Continue to JLCPCB >
    </nuxt-link>
  </div>
</template>

<script>
  export default {
    name: 'SuccShow',
    data() {
      return {}
    },
    methods: {}
  }
</script>

<style scoped lang="scss"></style>
