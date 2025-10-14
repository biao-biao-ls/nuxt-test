import pcbIcon from '../imgs/PCB_icon.svg'
import pcbaIcon from '../imgs/PCBA_icon.svg'
import stencilIcon from '../imgs/Stencil_icon.svg'
import electronicComponentsIcon from '../imgs/Electronic__Components_icon.svg'
import tdPrintingIcon from '../imgs/3D__Printing_icon.svg'
import CNCMachiningIcon from '../imgs/CNC__Machining_icon.svg'
import MechatronicPartsIcon from '../imgs/Mechatronic__Parts_icon.svg'
import PCBLayoutIcon from '../imgs/PCB  Layout_icon.png'
// import flexibleHeaterIcon from '../imgs/flexible-heater.png'

export type BusinessItemType = {
  label: string
  icon: any
  ml: string
  value: number
}

export const business: BusinessItemType[] = [
  {
    label: 'PCB',
    icon: pcbIcon,
    ml: '0',
    value: 2
  },
  {
    label: 'PCBA',
    icon: pcbaIcon,
    ml: '10px',
    value: 4
  },
  {
    label: 'Stencil',
    icon: stencilIcon,
    ml: '10px',
    value: 3
  },
  {
    label: 'Electronic Components',
    icon: electronicComponentsIcon,
    ml: '0',
    value: 10
  },
  {
    label: '3D Printing',
    icon: tdPrintingIcon,
    ml: '10px',
    value: 7
  },
  {
    label: 'CNC Machining',
    icon: CNCMachiningIcon,
    ml: '0',
    value: 8
  },
  {
    label: 'Mechatronic Parts',
    icon: MechatronicPartsIcon,
    ml: '10px',
    value: 9
  },
  {
    label: 'PCB Layout',
    icon: PCBLayoutIcon,
    ml: '0',
    value: 11
  }
  // {
  //   label: 'Flexible Heater',
  //   icon: flexibleHeaterIcon,
  //   ml: '10px',
  //   value: 16
  // }
]

export const helloText = 'Hello! Please let me know how I can help you today?'

export const waitText =
  'Sorry for waiting due to peak hour. One of our representatives will be with you shortly. Thank you for your patience.'

export const unOnlineText = `Sorry, we aren't online at the moment. Leave a message and we'll get back to you.`

// 表情包
export const emojiArr = {
  '[emoji::01]': require(`../imgs/qq/1.png`),
  '[emoji::02]': require(`../imgs/qq/2.png`),
  '[emoji::03]': require(`../imgs/qq/3.png`),
  '[emoji::04]': require(`../imgs/qq/4.png`),
  '[emoji::05]': require(`../imgs/qq/5.png`),
  '[emoji::06]': require(`../imgs/qq/6.png`),
  '[emoji::07]': require(`../imgs/qq/7.png`),
  '[emoji::08]': require(`../imgs/qq/8.png`),
  '[emoji::09]': require(`../imgs/qq/9.png`),
  '[emoji::10]': require(`../imgs/qq/10.png`),
  '[emoji::11]': require(`../imgs/qq/11.png`),
  '[emoji::12]': require(`../imgs/qq/12.png`),
  '[emoji::13]': require(`../imgs/qq/13.png`),
  '[emoji::14]': require(`../imgs/qq/14.png`),
  '[emoji::15]': require(`../imgs/qq/15.png`),
  '[emoji::16]': require(`../imgs/qq/16.png`)
}

export const markEmojiArr = {
  '[emoji::18]': require(`../imgs/qq/18.png`),
  '[emoji::19]': require(`../imgs/qq/19.png`),
  '[emoji::17]': require(`../imgs/qq/17.png`),
  '[emoji::01]': require(`../imgs/qq/1.png`),
  '[emoji::09]': require(`../imgs/qq/9.png`),
  '[emoji::11]': require(`../imgs/qq/11.png`)
}
