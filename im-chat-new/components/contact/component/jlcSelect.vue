<template>
  <div class="jlc-select-wrap">
    <el-select
      ref="elSelect"
      v-model="selectVal"
      class="w-full"
      :placeholder="placeholder"
      @visible-change="handleVisibleChange"
    >
      <el-option v-for="item in data" :key="item.value" :label="item.label" :value="item.value">
        {{ item.label }}
      </el-option>
    </el-select>
  </div>
</template>

<script>
  export default {
    name: 'JlcSelect',
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      value: {
        type: [String, Number],
        default() {
          return ''
        }
      },
      data: {
        type: Array,
        default() {
          return []
        }
      },
      placeholder: {
        type: String,
        default() {
          return ''
        }
      }
    },
    data() {
      this.dropDownElem = null
      return {}
    },
    computed: {
      selectVal: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('change', val)
        }
      }
    },
    methods: {
      // 下拉框出现时触发,UI要求下拉框更换样式
      handleVisibleChange(flag) {
        if (flag && !this.dropDownElem) {
          this.dropDownElem = this.$refs.elSelect?.$children?.[1]?.$el ?? null
          if (this.dropDownElem) {
            if (this.dropDownElem.childNodes[2]) {
              this.dropDownElem.childNodes[2].style.display = 'none'
            }
            this.$nextTick(() => {
              this.dropDownElem.style.margin = 'auto'
            })
          }
        }
      }
    }
  }
</script>

<style scoped lang="scss"></style>
