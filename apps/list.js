// import { Config, Render } from '#components'
// import { Utils } from '#models'

// export class list extends plugin {
//   constructor () {
//     super({
//       name: '清语表情:列表',
//       event: 'message',
//       priority: -Infinity,
//       rule: [
//         {
//           reg: /^#?(?:(清语)?表情|(?:clarity-)?meme)列表$/i,
//           fnc: 'list'
//         }
//       ]
//     })
//   }

//   async list (e) {
//     if (!Config.meme.enable) return false
//     try {
//       const infoMap = Utils.Tools.getInfoMap()
//       const keys = Object.keys(infoMap)

//       if (!keys.length) {
//         await e.reply('没有可用的表情列表', true)
//         return true
//       }

//       const emojiList = keys.flatMap(key => {
//         const emoji = infoMap[key]
//         const { min_texts, min_images, args_type } = emoji.params_type

//         const types = []
//         if (min_texts >= 1) types.push('text')
//         if (min_images >= 1) types.push('image')
//         if (args_type !== null) types.push('arg')

//         return emoji.keywords.map(keyword => ({
//           name: keyword,
//           types
//         }))
//       })

//       const total = keys.length

//       const img = await Render.render(
//         'meme/list',
//         {
//           emojiList,
//           total
//         }
//       )
//       await e.reply(img)
//       return true
//     } catch (error) {
//       logger.error('加载表情列表失败:', error)
//       await e.reply('加载表情列表失败，请稍后重试', true)
//       return true
//     }
//   }
// }
