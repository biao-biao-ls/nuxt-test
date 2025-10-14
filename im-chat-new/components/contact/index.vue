<template>
  <div class="contact-index-im">
    <div class="contact-content-im">
      <!--表单提交前-->
      <div class="mx-auto">
        <div class="form-area">
          <el-form ref="form" :model="form" :rules="rules" class="relative" label-position="top">
            <el-form-item v-if="formShow.mailboxFlag" prop="emailAddress">
              <span slot="label">
                Email
                <span class="text-[#FF2E62]">*</span>
              </span>
              <el-input v-model="form.emailAddress" placeholder="Email"></el-input>
            </el-form-item>
            <el-form-item prop="problemTypeConfigAccessId" label="What do you need help with?">
              <span slot="label">
                What do you need help with?
                <span class="text-[#FF2E62]">*</span>
              </span>
              <el-select v-model="form.problemTypeConfigAccessId" placeholder="" style="width: 100%">
                <el-option
                  v-for="item in quesTypeOpts"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-if="formShow.emailContentFlag" prop="emailContent" label="How can we help?">
              <span slot="label">
                How can we help?
                <span class="text-[#FF2E62]">*</span>
              </span>
              <JlcWmEditorComp
                key="key-123"
                ref="jlcWmEditor"
                v-model="form.emailContent"
                :show-toolbar="false"
                :rich-err="richTextErr"
                :editor-height="67"
                upload-img-file-type="cmsUploadFileCommon"
                :mode="'simple'"
                placeholder="Please enter the details of your request."
              ></JlcWmEditorComp>
            </el-form-item>
            <div class="upload-box mt-10">
              <contact-upload @on-change="getUploadList"></contact-upload>
            </div>
            <div class="submit-btn mt-20">
              <el-button
                type="primary"
                round
                class="w-[100%] h-40 rounded-[40px] text-16 font-bold"
                :disabled="isSubmited"
                @click="handleSubmit"
              >
                <i v-if="submitLoading" class="el-icon-loading"></i>
                Submit
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { debounce } from '@jlc/utils'
  import contactUpload from './component/contactUpload.vue'
  import { queryCmsProblemType, saveContactUsRecordWeb } from '#shared/apis'
  import contactUsImg from '#shared/assets/images/service/contact_us_img.png'
  // import JlcWmEditor from '#shared/components/jlc-wm-editor/index.vue'
  // import user from '@/mixins/user'

  const formItemFlags = ['corporateNameFlag', 'emailContentFlag', 'emailTitleFlag', 'mailboxFlag', 'nameFlag']

  export default {
    name: 'ContactIndex',
    components: {
      contactUpload
      // JlcWmEditor
    },
    // mixins: [user],
    inject: ['currentBusiness'],
    data() {
      const errFormMsg = 'This field is required.'
      const getRuleItem = () => [{ required: true, message: errFormMsg, trigger: 'change' }]
      return {
        contactUsImg,
        quesTypeOpts: [], // 问题分类options
        richTextErr: false, // 单独给富文本报错样式
        form: {
          problemTypeConfigAccessId: '', // 分类
          name: '', // 姓名
          emailAddress: '', // 邮箱
          companyName: '', // 公司名称
          emailSubject: '', // 邮件主题
          emailContent: '', // 邮件内容
          fileAccessIdList: [], // 上传附件list
          contactUsEntryCode: 10 // im 提交留言默认10
        },
        rules: {
          problemTypeConfigAccessId: getRuleItem(),
          name: getRuleItem(),
          emailAddress: getRuleItem(),
          companyName: getRuleItem(),
          emailSubject: getRuleItem(),
          emailContent: getRuleItem()
        },
        isSubmited: false, // 是否提交过
        submitLoading: false // 提交loading
      }
    },

    computed: {
      // 判断表单上传附件中是否还有未上传完的文件
      isUploadEnd() {
        if (!this.form.fileAccessIdList.length) return true
        return !this.form.fileAccessIdList.some((item) => item._loading === true)
      },
      // 根据后端返回的flag控制展示form表单项
      formShow() {
        if (!this.form.problemTypeConfigAccessId) {
          const row = {}
          formItemFlags.forEach((k) => {
            row[k] = true
          })
          return row
        }
        const optsItem = this.quesTypeOpts.find((item) => item.value === this.form.problemTypeConfigAccessId) || {}
        return formItemFlags.reduce((obj, flag) => {
          obj[flag] = typeof optsItem[flag] === 'boolean' ? optsItem[flag] : false
          return obj
        }, {})
      }
    },
    async mounted() {
      await this.getQuesTypeList()
    },
    methods: {
      // 获取问题分类
      async getQuesTypeList() {
        try {
          const res = await queryCmsProblemType({
            languageCode: this.$store?.state?.language || 'en',
            _t: Date.now()
          })
          if (res) {
            this.quesTypeOpts = (res || []).map((item) => {
              return {
                ...item,
                label: item.type,
                value: item.problemTypeConfigAccessId
              }
            })
          }
        } catch (err) {
          console.log(err)
        }
      },
      handleSubmit: debounce(function () {
        if (this.isSubmited) return
        this.richTextErr = false
        this.$refs.form.validate((valid) => {
          if (!this.form.emailContent) {
            this.richTextErr = true
          }
          if (valid && !this.richTextErr) {
            if (!this.isUploadEnd) {
              this.$message.error('There are still attachments being uploaded.')
              return
            }
            this.submitLoading = true
            this.isSubmited = true
            this.submitData()
          }
        })
      }, 300),
      /*
       * @info 提交表单数据
       * */
      async submitData() {
        try {
          const req = this.createSubmitParams()
          req.emailAddress = `{secret}${req.emailAddress}`
          const res = await saveContactUsRecordWeb(req, { encrypt: true })
          this.submitLoading = false
          this.isSubmited = false
          if (res) {
            this.$message.success('success')
            this.$emit('submit')
          } else {
            this.$message.error(res.message || 'failed')
          }
        } catch (err) {
          this.submitLoading = false
          this.isSubmited = false
          console.log(err)
        }
      },
      createSubmitParams() {
        const params = {
          problemTypeConfigAccessId: this.form.problemTypeConfigAccessId,
          fileAccessIdList: this.form.fileAccessIdList.map((item) => item.fileAccessId),
          languageCode: this.$store?.state?.language || 'en',
          contactUsEntryCode: this.form.contactUsEntryCode,
          businessType: this.currentBusiness?.value + ''
        }
        // 这里后端没用统一字段参数,前端判断过滤一下, 只有展示出来的表单才提交到表单接口
        formItemFlags.forEach((flag) => {
          if (this.formShow[flag]) {
            switch (flag) {
              case 'nameFlag':
                params.name = this.form.name
                break
              case 'mailboxFlag':
                params.emailAddress = this.form.emailAddress
                break
              case 'corporateNameFlag':
                params.companyName = this.form.companyName
                break
              case 'emailTitleFlag':
                params.emailSubject = this.form.emailSubject
                break
              case 'emailContentFlag':
                params.emailContent = this.$xss(this.form.emailContent)
                break
              default:
                break
            }
          }
        })
        return params
      },
      getUploadList(list) {
        this.form.fileAccessIdList = list
      },
      resetField() {
        this.$refs.form?.resetField()
      }
    }
  }
</script>

<style lang="scss">
  .contact-index-im .contact-content-im {
    .el-form--label-top .el-form-item__label {
      color: #222222;
      line-height: 16px;
      padding: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      &:before {
        display: none;
      }
    }
    $inputbg: #f5f7f9;
    .el-input .el-input__inner {
      background-color: #fff;
      height: 40px;
      line-height: 40px;
    }
    .el-select .el-input .el-input__inner {
      background-color: #fff;
      height: 34px;
      line-height: 34px;
    }
    .el-textarea {
      textarea {
        color: #222222;
      }
    }
    $errcol: #ff2e62;
    .el-form-item.is-error .el-input__inner,
    .el-form-item.is-error .el-input__inner:focus,
    .el-form-item.is-error .el-textarea__inner,
    .el-form-item.is-error .el-textarea__inner:focus {
      border-color: $errcol;
    }
    .el-form-item__error {
      font-size: 14px;
      color: $errcol;
    }

    .el-form-item__content {
      line-height: 1;
    }
  }
</style>

<style scoped lang="scss">
  .contact-us-img {
    position: absolute;
    width: 280px;
    height: 242px;
    right: 0;
    top: 30px;
  }
  .grid-form {
    display: grid;
    grid-column-gap: 30px;
    grid-template-columns: repeat(2, 285px);
  }
</style>
