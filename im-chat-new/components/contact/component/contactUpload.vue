<template>
  <div class="contact-upload">
    <el-upload
      action=""
      :http-request="handleFileUpload"
      :disabled="uploadFileList.length >= uploadMaxNum"
      :show-file-list="false"
      :accept="uploadAcceptType.map((item) => `.${item}`).join(',')"
      :before-upload="beforeUpload"
      :on-error="onError"
    >
      <div class="upload-box--btn flex items-center">
        <el-popover placement="top" trigger="hover" width="290" :content="uploadTips">
          <div slot="reference" class="cursor-pointer inline-flex items-center">
            <img src="../../../imgs/attach_icon_help_new.svg" width="16px" height="16px" />
            <span class="ml-8 text-999999 hover:text-2B8CED text-14">Upload file</span>
          </div>
        </el-popover>
        <div v-if="errUploadMsg" class="err-msg inline-block text-14 text-[#ff2e62] ml-20 mt-[-5px]">
          {{ errUploadMsg }}
        </div>
      </div>
    </el-upload>
    <ul class="file-list flex flex-wrap items-center justify-start mt-12">
      <li
        v-for="(item, index) in uploadFileList"
        :key="index"
        v-loading="item._loading"
        class="file-list--item inline-flex h-[30px] items-center p-6 rounded-[2px] bg-[#f7faff] mr-8 relative"
      >
        <img src="../../../imgs/attach.svg" width="18px" height="18px" class="flex-shrink-0" />
        <span class="ml-2 file-name inline-block text-ellipsis overflow-hidden whitespace-nowrap flex-shrink-0">
          {{ ellipsisFileName(item.fileName + '.' + item.fileType, 8) }}
        </span>
        <img
          src="../../../imgs/close_small.svg"
          class="ml-4 cursor-pointer flex-shrink-0 delete-icon"
          width="14px"
          height="14px"
          @click.stop="handleDelFile(index)"
        />
      </li>
    </ul>
  </div>
</template>

<script>
  import { uploadEmailThreadFileNew } from '#shared/apis'
  export default {
    name: 'ContactUpload',
    components: {},
    props: {},
    data() {
      return {
        uploadAcceptType: ['jpg', 'png', 'pdf', 'zip', 'rar'],
        errUploadMsg: '',
        uploadMaxSize: 10, // 10M
        uploadMaxNum: 5,
        uploadFileList: []
      }
    },
    computed: {
      uploadTips() {
        return `Allow files of type {0}.Up to ${this.uploadAcceptType.join(', ')} files, max ${
          this.uploadMaxSize
        }MB each.`
      }
    },
    methods: {
      beforeUpload(file) {
        this.errUploadMsg = ''
        const { size } = file || {}
        if (size / 1024 / 1024 >= this.uploadMaxSize) {
          this.errUploadMsg = `Cannot upload a file over ${this.uploadMaxSize}MB`
          return false
        }
        const { name, uid } = file
        const fileName = name.substring(0, name.indexOf('.') + 1)
        const fileType = name.substring(name.lastIndexOf('.') + 1)
        this.uploadFileList.push({
          fileName,
          fileType,
          uid,
          _loading: true
        })
        this.$emit('on-change', this.uploadFileList)
        return file
      },
      async handleFileUpload(fileData) {
        const originFile = fileData.file
        const fileIndex = this.uploadFileList.findIndex((item) => item.uid === originFile.uid)
        try {
          // 不设置超时 (为了跟邮件系统保持一致,这里不管是发送图片还是附件统一用type为1)
          const formData = new FormData()
          formData.append('file', fileData.file)
          formData.append('type', 'emailAttachmentFile')
          const res = await uploadEmailThreadFileNew(formData, { timeout: undefined })
          if (res) {
            if (fileIndex >= 0) {
              this.$set(this.uploadFileList[fileIndex], 'fileAccessId', res)
              Reflect.deleteProperty(this.uploadFileList[fileIndex], '_loading')
              this.$emit('on-change', this.uploadFileList)
            }
          } else {
            this.$message.error(res.message)
            this.catchUploadErr(fileIndex)
          }
        } catch (err) {
          console.log(err)
          this.catchUploadErr(fileIndex)
        }
      },
      catchUploadErr(fileIndex) {
        if (fileIndex >= 0) {
          this.uploadFileList.splice(fileIndex, 1)
          this.$emit('on-change', this.uploadFileList)
        }
      },
      onError(err) {
        console.log('err', err)
      },
      handleDelFile(index) {
        this.uploadFileList.splice(index, 1)
        this.$emit('on-change', this.uploadFileList)
      },
      /**
       * @info 文件名中间省略
       * @param str {String} 需要省略的文本
       * @param len {Number} 大于等于多少位后裁切
       * @param postfix {String} 文件名後綴
       */
      ellipsisFileName(str, len = 5, postfix) {
        if (!str) return str
        if (str.length < len) return str
        if (postfix) {
          const result = str.match(postfix)
          if (result) {
            const name = str.substring(0, result.index)
            return `${name.slice(0, len)}......${name.slice(name.length - 3)}${postfix}`
          }
        } else {
          const index = str.lastIndexOf('.')
          if (index > -1) {
            const name = str.substring(0, index)
            const fix = str.substring(index)
            return `${name.slice(0, len)}......${name.slice(name.length - 3)}${fix}`
          }
        }
        return str
      }
    }
  }
</script>

<style lang="scss">
  .contact-upload {
    .progress-bar {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      left: 26px;
      width: 80%;
      .el-progress-bar__outer {
        background: #cccccc;
      }
    }
    .file-list {
      gap: 8px;
      .el-loading-mask {
        .el-loading-spinner .circular {
          width: 22px !important;
        }
      }
    }
  }
</style>

<style scoped lang="scss">
  .file-list {
    &--item {
      animation: topIn 1s cubic-bezier(0.55, 0, 0.1, 1);
      @keyframes topIn {
        from {
          transform: translateY(-15px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    }
  }
</style>
