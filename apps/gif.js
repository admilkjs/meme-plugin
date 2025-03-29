import { Version } from '#components'
import { gif, Utils } from '#models'

export class gifImage extends plugin {
  constructor () {
    super({
      name: '清语表情:Gif工具',
      event: 'message',
      priority: -Infinity,
      rule: [
        {
          reg: /^#?(?:(清语)?表情|meme(?:-plugin)?)?gif分解$/i,
          fnc: 'silce'
        },
        {
          reg: /^#?(?:(清语)?表情|meme(?:-plugin)?)?gif变速\s*(.+?)$/i,
          fnc: 'gearshift'
        }
      ]
    })
  }

  async silce (e) {
    try {
      const images = await Utils.Common.getImage(e)
      if (!images || images.length === 0) {
        throw new Error('没有找到图片')
      }

      const gifFrames = await gif.slice(images[0])
      if (!gifFrames || gifFrames.length === 0) {
        throw new Error('GIF 解析失败')
      }

      const replyMessage = [
        { user_id: e.self_id, nickname: Version.Plugin_AliasName, message: '===== 分解的图片 =====' },
        ...await Promise.all(gifFrames.map(async frame => ({
          user_id: e.self_id,
          nickname: Version.Plugin_AliasName,
          message: segment.image(await Utils.Common.getImageBase64(frame, true))
        }))),
        { user_id: e.self_id, nickname: Version.Plugin_AliasName, message: '===== 分解的图片 =====' }
      ]

      await e.reply(Bot.makeForwardMsg(replyMessage))
    } catch (error) {
      await e.reply(`处理 GIF 时出错，请稍后再试: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async gearshift (e) {
    const message = (e.msg || '').trim()
    const match = message.match(this.rule[1].reg)
    if (!match) return
    const spend = match[2]
    try {
      const image = await Utils.Common.getImage(e)
      if (!image) throw new Error('没有找到图片')
      const speedImage = await gif.gearshift(image[0], spend)
      await e.reply(segment.image(`${await Utils.Common.getImageBase64(speedImage, true)}`))
    } catch (error) {
      await e.reply(`处理 GIF 时出错，请稍后再试, ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}
