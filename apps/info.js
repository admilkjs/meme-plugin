import { Config } from '#components'
import { Utils } from '#models'

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
    if (!Config.meme.enable) return false
    const message = (e.msg || '').trim()
    const match = message.match(this.rule[0].reg)
    if (!match) return

    const keyword = match[2]
    const memeKey = await Utils.Tools.getKey(keyword) ?? null
    const memeParams = await Utils.Tools.getParams(memeKey) ?? null

    if (!memeKey || !memeParams) {
      await e.reply('未找到相关表情包详情, 请稍后再试', true)
      return true
    }

    const {
      min_texts = 0,
      max_texts = 0,
      min_images = 0,
      max_images = 0
    } = memeParams

    const argsdescObj = await Utils.Tools.getDescriptions(memeKey) ?? null
    const argsdesc = argsdescObj && Object.keys(argsdescObj).length > 0
      ? Object.entries(argsdescObj).map(([paramName, description]) => `[${paramName}: ${description}]`).join(' ')
      : null

    let aliasList = await Utils.Tools.getKeyWords(memeKey) ?? null
    aliasList = Array.isArray(aliasList) ? aliasList.flat() : null
    const alias = aliasList ? aliasList.map(text => `[${text}]`).join(' ') : '[无]'

    let defTextList = await Utils.Tools.getDeftext(memeKey) ?? null
    defTextList = Array.isArray(defTextList) ? defTextList.flat() : null
    const defText = defTextList ? defTextList.map(text => `[${text}]`).join(' ') : '[无]'

    let tagsList = await Utils.Tools.getTags(memeKey) ?? null
    tagsList = (Array.isArray(tagsList) && tagsList.length > 0) ? tagsList.flat() : null
    const tags = tagsList ? tagsList.map(tag => `[${tag}]`).join(' ') : '[无]'


    let previewImageBase64 = null
    try {
      const previewUrl = await Utils.Tools.getPreviewUrl(memeKey)
      if (previewUrl) {
        previewImageBase64 = await Utils.Common.getImageBase64(previewUrl, true)
      }
    } catch {
      previewImageBase64 = null
    }

    const replyMessage = [
      `名称: ${memeKey}\n`,
      `别名: ${alias}\n`,
      `最大图片数量: ${max_images}\n`,
      `最小图片数量: ${min_images}\n`,
      `最大文本数量: ${max_texts}\n`,
      `最小文本数量: ${min_texts}\n`,
      `默认文本: ${defText}\n`,
      `标签: ${tags}`
    ]

    if (argsdesc !== null) {
      replyMessage.push(`\n可选参数:\n${argsdesc}`)
    }

    if (previewImageBase64) {
      replyMessage.push('\n预览图片:\n')
      replyMessage.push(segment.image(previewImageBase64))
    } else {
      replyMessage.push('\n预览图片:\n')
      replyMessage.push('预览图片加载失败')
    }

    await e.reply(replyMessage, true)
    return true
  }
}
