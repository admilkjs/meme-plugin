import fs from 'node:fs/promises'
import { Version, Data, Config } from '#components'
import Request from './request.js'
import { Tools } from './tools.js'

const Common = {

  /**
  * 获取图片 Buffer
  * @param {string | Buffer} image - 图片地址或 Buffer
  * @returns {Promise<Buffer>} - 返回图片的 Buffer 数据
  * @throws {Error} - 如果图片地址为空或请求失败，则抛出异常
  */
  async getImageBuffer (image) {
    if (!image) throw new Error('图片地址不能为空')

    if (Buffer.isBuffer(image)) {
      return image
    }

    const response = await Utils.Request.get(image, {}, {}, 'arraybuffer')
    if (response.success) {
      return response.data
    } else {
      throw new Error('图片请求失败')
    }
  },

  /**
 * 获取图片 Base64 字符串
 * @param {string | Buffer} image - 图片的 URL、Buffer 或 Base64 字符串
 * @param {boolean} withPrefix - 是否添加 base64:// 前缀，默认 false
 * @returns {Promise<string>} - 返回图片的 Base64 字符串，带或不带前缀
 * @throws {Error} - 如果图片地址为空或处理失败，则抛出异常
 */
  async getImageBase64 (image, withPrefix = false) {
    if (!image) logger.error(`[${Version.Plugin_AliasName}] 图片地址不能为空`)

    if (typeof image === 'string' && image.startsWith('base64://')) {
      return withPrefix ? image : image.replace('base64://', '')
    }

    if (Buffer.isBuffer(image)) {
      const base64Data = image.toString('base64')
      return withPrefix ? `base64://${base64Data}` : base64Data
    }

    const response = await Request.get(image, {}, {}, 'arraybuffer')
    if (response.success) {
      const buffer = response.data
      const base64Data = Buffer.from(buffer).toString('base64')
      return withPrefix ? `base64://${base64Data}` : base64Data
    } else {
      logger.error(`[${Version.Plugin_AliasName}] 图片处理失败, 错误信息: ${response.message}`)
    }
  },

  /**
 * 获取用户头像
 * @param {string | string[]} userList - 单个或多个 QQ 号
 * @returns {Promise<Buffer[]>} - 返回头像 Buffer 数组
 * @throws {Error} - 如果用户列表为空或头像获取失败，则抛出异常
 */
  async getAvatar (e, userList) {
    if (!userList) {
      throw new Error('QQ 号不能为空')
    }
    if (!Array.isArray(userList)) userList = [userList]

    const cacheDir = `${Version.Plugin_Path}/data/avatar`
    if (!await Tools.fileExistsAsync(cacheDir)) {
      await Data.createDir('data/avatar', '', false)
    }

    const defaultAvatarPath = `${Version.Plugin_Path}/resources/meme/imgs/default_avatar.png`

    const downloadAvatar = async (qq) => {
      const cachePath = `${cacheDir}/avatar_${qq}.png`
      let avatarUrl = ''

      try {
        if (e.isGroup) {
          const member = Bot[e.self_id].pickGroup(e.group_id).pickMember(qq)
          avatarUrl = await member.getAvatarUrl()
        } else if (e.isPrivate) {
          const friend = Bot[e.self_id].pickFriend(qq)
          avatarUrl = await friend.getAvatarUrl()
        }
      } catch (err) {
      }

      if (!avatarUrl) {
        avatarUrl = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${qq}`
      }

      if (await Tools.fileExistsAsync(cachePath)) {
        const localStats = await fs.stat(cachePath)
        const remoteHeadResponse = await Request.head(avatarUrl).catch(() => null)

        if (remoteHeadResponse && remoteHeadResponse.success) {
          const remoteLastModified = new Date(remoteHeadResponse.data['last-modified'])
          const localLastModified = localStats.mtime

          if (localLastModified >= remoteLastModified) {
            return await fs.readFile(cachePath)
          }
        }
      }

      const bufferResponse = await Request.get(avatarUrl, {}, {}, 'arraybuffer')
      if (bufferResponse.success) {
        const buffer = bufferResponse.data
        await fs.writeFile(cachePath, buffer)
        return buffer
      } else {
        return await fs.readFile(defaultAvatarPath)
      }
    }

    const results = await Promise.all(
      userList.map((qq) => downloadAvatar(qq))
    )
    return results
  },


  /**
   * 获取用户昵称
   * @param {string} qq - QQ 号
   * @param {object} e - 消息对象，用于区分群聊或私聊
   * @returns {Promise<string>} - 返回用户昵称，若获取失败则返回 "未知"
   */
  async getNickname (e, qq) {
    if (!qq || !e) {
      return '未知'
    }

    try {
      if (e.isGroup) {
        const group = Bot[e.self_id].pickGroup(e.group_id)
        const Member = group.pickMember(qq)
        const MemberInfo = await Member.getInfo()
        return MemberInfo.card || MemberInfo.nickname || '未知'
      } else if (e.isPrivate) {
        const Friend = Bot[e.self_id].pickFriend(qq)
        const FriendInfo = await Friend.getInfo()
        return FriendInfo.nickname || '未知'
      }
    } catch (error) {
      return '未知'
    }
  },

  /**
   * 获取用户性别
   *
   * @async
   * @param {number} qq - 要查询的 QQ 号码。
   * @returns {Promise<string>} - 返回一个 Promise，其解析值为：
   *   - 'male'：男性。
   *   - 'female'：女性。
   *   - 'unknown'：未知性别。
   */
  async getGender (qq, e) {
    if (!qq || !e) {
      return 'unknown'
    }

    try {
      if (e.isGroup) {
        const group = Bot[e.self_id].pickGroup(e.group_id)
        const Member = group.pickMember(qq)
        const MemberInfo = await Member.getInfo()
        return MemberInfo.sex || 'unknown'
      } else if (e.isPrivate) {
        const Friend = Bot[e.self_id].pickFriend(qq)
        const FriendInfo = await Friend.getInfo()
        return FriendInfo.sex || 'unknown'
      }
    } catch (error) {
      return 'unknown'
    }
  },

  /**
   * 获取图片列表（包括消息和引用消息中的图片）
   * @param {object} e - 消息对象
   * @returns {Promise<Buffer[]>} - 返回图片 Buffer 数组
   */
  async getImage (e) {
    const imagesInMessage = e.message
      .filter((m) => m.type === 'image')
      .map((img) => img.url)

    const tasks = []

    /**
     * 获取引用消息中的图片
     */
    let quotedImages = []
    let source = null
    if(Config.meme.quotedImages){
      if (e.getReply) {
        source = await e.getReply()
      } else if (e.source) {
        if (e.isGroup) {
          source = await Bot[e.self_id].pickGroup(e.group_id).getChatHistory(e.source.seq || e.reply_id, 1)
        } else if (e.isPrivate) {
          source = await Bot[e.self_id].pickFriend(e.user_id).getChatHistory(e.source.time || e.reply_id, 1)
        }
      }
    }

    if (source) {
      const sourceArray = Array.isArray(source) ? source : [source]

      quotedImages = sourceArray
        .flatMap(item => item.message)
        .filter(msg => msg.type === 'image')
        .map(img => img.url)
    }

    if (quotedImages.length === 0 && source &&( e.source.user_id || e.message.map(msg => msg.type === 'reply').includes(true))) {
      sender = source.sender.user_id
      const avatarBuffer = await this.getAvatar(e, sender)
      if (avatarBuffe[0]) {
        quotedImages.push(avatarBuffer[0])
      }
    }


    /**
     * 引用消息中的图片任务
     */
    if (quotedImages.length > 0) {
      quotedImages.forEach((item) => {
        if (Buffer.isBuffer(item)) {
          tasks.push(Promise.resolve(item))
        } else {
          tasks.push(this.getImageBuffer(item))
        }
      })
    }

    /**
     * 消息中的图片任务
     */
    if (imagesInMessage.length > 0) {
      tasks.push(...imagesInMessage.map((imageUrl) => this.getImageBuffer(imageUrl)))
    }

    const results = await Promise.allSettled(tasks)
    const images = results
      .filter((res) => res.status === 'fulfilled' && res.value)
      .map((res) => res.value)

    return images
  }

}

export { Common }
