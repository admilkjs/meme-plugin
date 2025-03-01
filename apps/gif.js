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
        }
      ]
    })
  }

  async silce (e) {
    try {
      const image = await Utils.Common.getImage(e)
      if (!image) throw new Error('没有找到图片')
      let replyMessage = [
        ('=========== 分解的图片 ===========\n')
      ]

      const gifImages = await gif.slice(image[0])
      for (const frame of gifImages) {
        const base64Image = await Utils.Common.getImageBase64(frame, true)
        replyMessage.push(segment.image(base64Image))
      }
      replyMessage.push(('=========== 分解的图片 ==========='))
      await e.reply(Bot.makeForwardMsg(replyMessage))
    } catch (error) {
      await e.reply(`处理 GIF 时出错，请稍后再试, ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}
