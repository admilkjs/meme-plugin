import { Utils, Tools } from '#models'
import { Config } from '#components'
import FormData from 'form-data'
import { handleArgs, handle , descriptions } from './args.js'
import { handleImages } from './images.js'
import { handleTexts } from './texts.js'

async function make (e, memeKey, memeInfo, userText) {
  const {
    args_type,
    min_texts,
    max_texts,
    min_images,
    max_images,
    default_texts
  } = memeInfo.params_type
  const formData = new FormData()

  try {
    /**
     * 处理参数类型
     */
    if (args_type != null) userText = await handleArgs(memeKey, userText, formData)

    /**
     * 处理图片类型
     */
    if (max_images != 0) {
      const images = await handleImages(e, memeKey, userText, min_images, max_images, formData)
      if (!images.success) {
        return e.reply(`该表情至少需要 ${min_images} 张图片`, true)
      }
      userText = images.userText
    }

    /**
     * 处理文字类型
     */
    if (max_texts != 0){
      let finalTexts = await handleTexts(e, userText, min_texts, max_texts, default_texts,formData)
      if (!finalTexts) {
        return e.reply(`该表情至少需要 ${min_texts} 个文字描述`, true)
      }
    }
    const endpoint = `memes/${memeKey}/`
    const result = await Tools.request(endpoint, formData, 'POST', 'arraybuffer')

    const base64Image = await Utils.bufferToBase64(result)
    await e.reply(segment.image(base64Image), Config.meme.reply)

    if (Config.stats.enable) {
      const redisKey = `Yz:clarity-meme:stats:${memeKey}`
      await redis.set(redisKey, (parseInt(await redis.get(redisKey)) || 0) + 1)
    }
    return true
  } catch (error) {
    const errorMessage = await Utils.handleError(error)
    await e.reply(`[清语表情]生成表情包失败, 状态码: ${error.status}, 错误信息: ${errorMessage}`)
  }
}

const Meme = {
  make,
  Args: {
    descriptions,
    handle,
    handleArgs
  },
  Images: {
    handleImages
  },
  Texts: {
    handleTexts
  }
}
export default Meme
