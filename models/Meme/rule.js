import Utils from '../utils.js'
import { Config } from '#components'
import FormData from 'form-data'
import Tools from '../tools.js'
import { handleArgs } from './args.js'
import { handleImages } from './images.js'
import { handleTexts } from './texts.js'

const Rule = {
  async meme (e, memeKey, memeInfo, userText) {
    const { params_type } = memeInfo || {}
    const {
      min_texts,
      max_texts,
      min_images,
      max_images,
      default_texts,
      args_type
    } = params_type

    const formData = new FormData()

    try {
      /**
       * 处理参数类型
       */
      await handleArgs(memeKey, userText, args_type, formData)

      /**
       * 处理图片类型
       */
      let images = await handleImages(e, memeKey, userText, min_images, max_images, formData)
      if (!images) {
        return e.reply(`该表情至少需要 ${min_images} 张图片`, true)
      }

      /**
       * 处理文字类型
       */
      let finalTexts = await handleTexts(e, userText, min_texts, max_texts, formData)
      if (!finalTexts) {
        return e.reply(`该表情至少需要 ${min_texts} 个文字描述`, true)
      }

      const endpoint = `memes/${memeKey}/`
      const result = await Tools.request(endpoint, formData, 'POST', 'arraybuffer')

      if (Buffer.isBuffer(result)) {
        const base64Image = await Utils.bufferToBase64(result)
        await e.reply(segment.image(`base64://${base64Image}`), Config.meme.reply)
      } else {
        await e.reply(segment.image(result), Config.meme.reply)
      }

      if (Config.stats.enable) {
        const redisKey = `Yz:clarity-meme:stats:${memeKey}`
        await redis.set(redisKey, (parseInt(await redis.get(redisKey)) || 0) + 1)
      }
      return true
    } catch (error) {
      const errorMessage = await Utils.handleError(error)
      await e.reply(`[清语表情]生成表情包失败, 状态码: ${error.status}, 错误信息: ${errorMessage}`)
      return true
    }
  }
}

export { Rule }
