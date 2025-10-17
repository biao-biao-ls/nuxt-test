import { dealMsgList } from '../../utils'
import allocation from './allocation.json'
import messageList from './messageList.json'
import bgkill from './bgkill.json'
export default (opts: any) => {
  // 分配客服
  allocation.createTime = Date.now()
  // opts.onReceiveMessages(dealMsgList([allocation]))

  // setTimeout(() => {
  //   messageList[0].createTime = Date.now()
  //   opts.onReceiveMessages(dealMsgList(messageList))
  // }, 5000)
  // setTimeout(() => {
  //   opts.onReceiveMessages(dealMsgList([bgkill]))
  // }, 8000)
}
