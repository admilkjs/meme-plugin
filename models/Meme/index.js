import { Utils } from '#models'
import { Config, Version } from '#components'
import FormData from 'form-data'
import { handleArgs, handle } from './args.js'
import { handleImages } from './images.js'
import { handleTexts } from './texts.js'

async function make (e, memeKey, min_texts, max_texts, min_images, max_images, default_texts, args_type, userText) {
  const formData = new FormData()

  const atsInMessage = e.message
    .filter((m) => m.type === 'at')
    .map((at) => at.qq)
  const manualAts = [...userText.matchAll(/@\s*(\d+)/g)].map((match) => match[1])
  const allUsers = [...new Set([...atsInMessage, ...manualAts])]
  userText = userText.replace(/@\s*\d+/g, '').trim()
  try{
  /**
     * 处理参数类型
     */
    if (args_type != null) {
      const args = await handleArgs(e, memeKey, userText, allUsers, formData)
      if (args.success === false) {
        return e.reply(`该表情${args.message}`, true)
      }
      userText = args.text
    }
    /**
     * 处理图片类型
     */
    if (max_images !== 0) {
      const images = await handleImages(e, memeKey, userText, min_images, max_images, allUsers, formData)
      if (!images.success) {
        return e.reply(`该表情至少需要 ${min_images} 张图片`, true)
      }
      userText = images.userText
    }

    /**
     * 处理文字类型
     */
    if (max_texts !== 0){
      let finalTexts = await handleTexts(e, memeKey, userText, min_texts, max_texts, default_texts, allUsers, formData)
      if (!finalTexts) {
        return e.reply(`该表情至少需要 ${min_texts} 个文字描述`, true)
      }
    }

    const result = await Utils.Tools.request(memeKey, formData, 'arraybuffer')
    if (!result.success) throw new Error(result.message)
    const base64Image = await Utils.Common.getImageBase64(result.data, true)
    await e.reply(segment.image(base64Image), Config.meme.reply)
    if (Config.stats.enable) {
      const redisKey = `Yz:clarity-meme:stats:${memeKey}`
      await redis.set(redisKey, (parseInt(await redis.get(redisKey)) || 0) + 1)
    }
    return true
  } catch (error) {
    logger.error(error.message)
    let errorMessage
    try {
      const parsedError = JSON.parse(error.message)
      errorMessage = parsedError.detail
    } catch (parseError) {
      errorMessage = error.message
    }
    return e.reply(`[${Version.Plugin_AliasName}] 生成表情包失败，错误信息: ${errorMessage}`, true)
  }
}


export { make, handle, handleArgs, handleImages, handleTexts }
