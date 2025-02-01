import fs from 'node:fs/promises'
import { Version, Data } from '#components'
import Request from './request.js'
import Tools from './tools.js'

const Common = {

  /**
   * 获取图片 Buffer
   * @param {string | Buffer} image - 图片地址或 Buffer
   * @returns {Promise<Buffer>} - 返回图片的 Buffer 数据
   * @throws {Error} - 如果图片地址为空或请求失败，则抛出异常
   */
  async getImageBuffer (image) {
    if (!image) throw {
      status: 400,
      message: '图片地址不能为空'
    }

    if (Buffer.isBuffer(image)) {
      return image
    }

    try {
      const buffer = await Request.get(image, {}, 'arraybuffer')
      return buffer
    } catch (error) {
      throw {
        status: 510,
        message: '图片请求失败'
      }
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
    if (!image) throw {
      status: 400,
      message: '图片地址不能为空'
    }

    if (typeof image === 'string' && image.startsWith('base64://')) {
      return withPrefix ? image : image.replace('base64://', '')
    }

    try {
      if (Buffer.isBuffer(image)) {
        const base64Data = image.toString('base64')
        return withPrefix ? `base64://${base64Data}` : base64Data
      }

      const buffer = await Request.get(image, {}, 'arraybuffer')
      const base64Data = Buffer.from(buffer).toString('base64')
      return withPrefix ? `base64://${base64Data}` : base64Data
    } catch (error) {
      throw {
        status: 510,
        message: '图片处理失败'
      }
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
      throw {
        status: 400,
        message: 'QQ 号不能为空'
      }
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

      try {
        if (await Tools.fileExistsAsync(cachePath)) {
          const localStats = await fs.stat(cachePath)
          const remoteHeaders = await Request.head(avatarUrl).catch(() => null)

          if (remoteHeaders) {
            const remoteLastModified = new Date(remoteHeaders['last-modified'])
            const localLastModified = localStats.mtime

            if (localLastModified >= remoteLastModified) {
              return await fs.readFile(cachePath)
            }
          }
        }

        const buffer = await Request.get(avatarUrl, {}, 'arraybuffer').catch(() => null)
        if (buffer && Buffer.isBuffer(buffer)) {
          await fs.writeFile(cachePath, buffer)
          return buffer
        } else {
          return await fs.readFile(defaultAvatarPath)
        }
      } catch (error) {
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

    if (e.getReply) {
      source = await e.getReply()
    } else if (e.source) {
      if (e.isGroup) {
        source = Bot[e.self_id].pickGroup(e.group_id).getChatHistory(e.source.seq, 1).pop()
      } else if (e.isPrivate) {
        source = Bot[e.self_id].pickFriend(e.user_id).getChatHistory(e.source.time, 1).pop()
      }
    }

    if (source) {
      quotedImages = source.message
        .filter((msg) => msg.type === 'image')
        .map((img) => img.url)
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
  },

  /**
   * 处理错误异常信息
   * @param {object} error - 异常对象
   * @returns {string} - 返回处理后的错误消息
   */
  async handleError (error) {
    const { status, message } = error
    let serverMsg = ''

    try {
      const parsedMessage = JSON.parse(message.toString())
      serverMsg = parsedMessage.detail
    } catch (e) {
      serverMsg = message
    }

    switch (status) {
      case 400:
        return message
      case 404:
        return message || '资源不存在'
      case 500:
        return message || '表情服务请求失败，请稍后再试。'
      case 510:
        return message
      /**
       * 表情服务端状态码
       */
      case 520:
      case 531:
      case 532:
      case 533:
      case 540:
      case 541:
      case 542:
      case 543:
      case 550:
      case 552:
      case 560:
        return serverMsg
    }
  }

}

export default Common
