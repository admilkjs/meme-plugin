import { Config } from '#components'
import { Utils, Tools } from '#models'

export class info extends plugin {
  constructor () {
    super({
      name: '清语表情:表情包详情',
      event: 'message',
      priority: -Infinity,
      rule: [
        {
          reg: /^#?(?:(清语)?表情|(?:clarity-)?meme)\s*详情\s*(.+?)$/i,
          fnc: 'info'
        }
      ]
    })
  }

  async info (e) {
    if (!Config.meme.Enable) return false

    const message = (e?.msg || '').trim()
    const match = message.match(this.rule[0].reg)
    if (!match) return

    const keyword = match[2]
    const memeKey = Tools.getKey(keyword)
    const memeDetails = memeKey ? Tools.getInfo(memeKey) : null

    if (!memeKey || !memeDetails) {
      await e.reply('未找到相关表情包详情', true)
      return true
    }

    const {
      min_texts = 0,
      max_texts = 0,
      min_images = 0,
      max_images = 0,
      default_texts = [],
      args_type = {}
    } = memeDetails.params_type

    let argsHint = '[无]'
    if (args_type != null) {
      argsHint = await Tools.descriptions(memeKey)
    }

    const aliases = memeDetails.keywords ? memeDetails.keywords.map(keyword => `[${keyword}]`).join('') : '[无]'
    const previewUrl = await Tools.getPreviewUrl(memeKey)

    let previewImageBase64 = ''
    try {
      const base64Data = await Utils.getImageBase64(previewUrl, true)
      previewImageBase64 = base64Data
    } catch (error) {
      previewImageBase64 = '预览图片加载失败'
    }

    const defText = default_texts && default_texts.length > 0
      ? default_texts.map(text => `[${text}]`).join('')
      : '[无]'


    const replyMessage = [
      `名称: ${memeKey}\n`,
      `别名: ${aliases}\n`,
      `最大图片数量: ${max_images}\n`,
      `最小图片数量: ${min_images}\n`,
      `最大文本数量: ${max_texts}\n`,
      `最小文本数量: ${min_texts}\n`,
      `默认文本: ${defText}`
    ]


    if (argsHint) {
      replyMessage.push(`\n描述/可选参数:\n${argsHint}`)
    }

    if (previewImageBase64) {
      replyMessage.push('\n预览图片:\n')
      replyMessage.push(segment.image(previewImageBase64))
    } else {
      replyMessage.push('\n预览图片:\n')
      replyMessage.push(previewImageBase64)
    }

    await e.reply(replyMessage, true)
    return true
  }
}
