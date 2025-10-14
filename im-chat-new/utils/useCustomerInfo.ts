import { inject, onMounted, ref, computed, Ref } from 'vue'
import logoUrl from '#shared/assets/images/component-im-logo.png'
import { imFileDownloadFile } from '#shared/apis'
import { getRobotName } from '#shared/utils'

export const useCustomerInfo = () => {
  const customerServiceInfo = inject('customerServiceInfo') as Ref<any>
  const isHasService = inject('isHasService') as Ref<any>

  const username = ref('JLCPCB')

  const avatarUrl = computed(() => {
    if (customerServiceInfo.value.eim) {
      return imFileDownloadFile(customerServiceInfo.value.eim)
    } else {
      return logoUrl
    }
  })

  onMounted(() => {
    username.value = getRobotName()
  })
  return {
    username,
    avatarUrl,
    customerServiceInfo,
    isHasService
  }
}
