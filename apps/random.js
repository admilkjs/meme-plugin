// import { Meme, Utils } from '#models'
// import { Config } from '#components'

// export class random extends plugin {
//   constructor () {
//     super({
//       name: '清语表情:随机表情包',
//       event: 'message',
//       priority: -Infinity,
//       rule: [
//         {
//           reg: /^#?(?:(清语)?表情|(?:clarity-)?meme)?随机(?:表情|meme)(包)?$/i,
//           fnc: 'random'
//         }
//       ]
//     })
//   }

//   async random (e) {
//     if (!Config.meme.enable) return false
//     try {
//       const memeKeys = Object.keys(Utils.Tools.getInfoMap())
//       if (memeKeys.length === 0) {
//         return true
//       }

//       let selectedMemeKey = null
//       let selectedParams = null

//       const randomMemeKeys = memeKeys.sort(() => Math.random() - 0.5)

//       randomMemeKeys.forEach(memeKey => {
//         if (selectedMemeKey) return

//         const params = Utils.Tools.getParams(memeKey)
//         if (!params) return

//         const { min_texts, max_texts, min_images, max_images } = params

//         const isValid =
//           (min_texts === 1 && max_texts === 1) ||
//           (min_images === 1 && max_images === 1) ||
//           (min_texts === 1 && min_images === 1 && max_texts === 1 && max_images === 1)

//         if (isValid) {
//           selectedMemeKey = memeKey
//           selectedParams = params
//         }
//       })

//       if (!selectedMemeKey) {
//         await e.reply('未找到有效的表情包')
//         return true
//       }

//       const { min_texts, max_texts, min_images, max_images, default_texts, args_type } = selectedParams

//       await Meme.make(e, selectedMemeKey, min_texts, max_texts, min_images, max_images, default_texts, args_type, '')
//     } catch (error) {
//       const errorMessage = await Utils.Common.handleError(error)
//       await e.reply(`[清语表情]生成随机表情包失败, 状态码: ${error.status}, 错误信息: ${errorMessage}`)
//     }
//   }
// }
