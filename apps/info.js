// import { Config } from '#components'
// import { Utils } from '#models'

// export class info extends plugin {
//   constructor () {
//     super({
//       name: '清语表情:表情包详情',
//       event: 'message',
//       priority: -Infinity,
//       rule: [
//         {
//           reg: /^#?(?:(清语)?表情|(?:clarity-)?meme)\s*详情\s*(.+?)$/i,
//           fnc: 'info'
//         }
//       ]
//     })
//   }

//   async info (e) {
//     if (!Config.meme.enable) return false
//     const message = (e.msg || '').trim()
//     const match = message.match(this.rule[0].reg)
//     if (!match) return

//     const keyword = match[2]
//     const memeKey = Utils.Tools.getKey(keyword)
//     const memeParams = Utils.Tools.getParams(memeKey)

//     if (!memeKey || !memeParams) {
//       await e.reply('未找到相关表情包详情, 请稍后再试', true)
//       return true
//     }

//     const {
//       min_texts = 0,
//       max_texts = 0,
//       min_images = 0,
//       max_images = 0
//     } = memeParams

//     const argsdesc = Utils.Tools.descriptions(memeKey)
//     const alias = Utils.Tools.getKeywords(memeKey).map(text => `[${text}]`).join('') || '[无]'

//     let previewImageBase64
//     try {
//       const previewUrl = await Utils.Tools.getPreviewUrl(memeKey)
//       previewImageBase64 = await Utils.Common.getImageBase64(previewUrl, true)
//     } catch {
//       previewImageBase64 = false
//     }
//     const defText = (Utils.Tools.getDeftext(memeKey).map(default_texts => `[${default_texts}]`).join('')) || '[无]'

//     const tags = (Utils.Tools.getTags(memeKey)) || '[无]'

//     const replyMessage = [
//       `名称: ${memeKey}\n`,
//       `别名: ${alias}\n`,
//       `最大图片数量: ${max_images}\n`,
//       `最小图片数量: ${min_images}\n`,
//       `最大文本数量: ${max_texts}\n`,
//       `最小文本数量: ${min_texts}\n`,
//       `默认文本: ${defText}\n`,
//       `标签: ${tags}`
//     ]

//     if (argsdesc) {
//       replyMessage.push(`\n可选参数:\n${argsdesc}`)
//     }

//     if (previewImageBase64) {
//       replyMessage.push('\n预览图片:\n')
//       replyMessage.push(segment.image(previewImageBase64))
//     } else {
//       replyMessage.push('\n预览图片:\n')
//       replyMessage.push('预览图片加载失败')
//     }

//     await e.reply(replyMessage, true)
//     return true
//   }
// }
