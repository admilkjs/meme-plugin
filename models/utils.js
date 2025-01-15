import fs from 'fs'
import { Version, Data } from '#components'
import Request from './request.js'
import Tools from './tools.js'

const Utils = {

  /**
   * 获取图片 Buffer
   */
  async getImageBuffer (image) {
    if (Buffer.isBuffer(image)) {
      return image
    }

    if (!image) throw {
      status: 400,
      message: '图片地址不能为空'
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
   * 将图片 Buffer 转换为 Base64
   */
  async bufferToBase64 (buffer) {
    if (typeof buffer === 'string' && buffer.startsWith('base64://')) {
      return buffer
    }

    if (!buffer) throw {
      status: 400,
      message: '图片Buffer不能为空'
    }

    try {
      const base64Data = buffer.toString('base64')
      return `base64://${base64Data}`
    } catch (error) {
      throw {
        status: 510,
        message: 'Base64 转换失败'
      }
    }
  },

  /**
 * 获取用户头像
 */
  async getAvatar (userList, e) {
    if (!userList) {
      throw {
        status: 400,
        message: 'QQ 号不能为空'
      }
    }
    if (!Array.isArray(userList)) userList = [userList]

    const cacheDir = `${Version.Plugin_Path}/data/avatar`
    if (!await Tools.fileExistsAsync(cacheDir)) {
      Data.createDir('data/avatar', '', false)
    }

    const defaultAvatarPath = `${Version.Plugin_Path}/resources/meme/imgs/default_avatar.png`

    const downloadAvatar = async (qq) => {
      const cachePath = `${cacheDir}/avatar_${qq}.png`
      const avatarUrl = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${qq}`

      try {
        if (await Tools.fileExistsAsync(cachePath)) {
          const localStats = fs.statSync(cachePath)
          const remoteHeaders = await Request.head(avatarUrl)
          const remoteLastModified = new Date(remoteHeaders['last-modified'])
          const localLastModified = localStats.mtime

          if (localLastModified >= remoteLastModified) {
            return fs.readFileSync(cachePath)
          }
        }

        const buffer = await Request.get(avatarUrl, {}, 'arraybuffer')
        if (buffer && Buffer.isBuffer(buffer)) {
          fs.writeFileSync(cachePath, buffer)
          return buffer
        } else {
          return fs.readFileSync(defaultAvatarPath)
        }
      } catch (error) {
        return fs.readFileSync(defaultAvatarPath)
      }
    }

    const results = await Promise.all(
      userList.map((qq) => downloadAvatar(qq))
    )

    return results
  },

  /**
 * 获取用户昵称
 */
  async getNickname (qq, e) {
    if (!qq || !e) {
      return '未知'
    }

    try {
      if (e.isGroup) {
        const group = Bot[e.self_id].pickGroup(e.group_id)
        const Member = group.pickMember(qq)
        const MemberInfo = await Member.getInfo()
        return MemberInfo.card || MemberInfo.nickname || '未知'
      } else {
        const Friend = Bot[e.self_id].pickFriend(qq)
        const FriendInfo = await Friend.getInfo()
        return FriendInfo.nickname || '未知'
      }
    } catch (error) {
      return '未知'
    }
  },

  /**
   * 获取图片
   **/
  async getImage (e, userText, max_images) {
    const imagesInMessage = e.message
      .filter((m) => m.type === 'image')
      .map((img) => img.url)

    const quotedImages = await this.getQuotedImages(e)

    let images = []
    let tasks = []

    /**
     * 引用消息中的图片
     */
    if (quotedImages.length > 0) {
      quotedImages.forEach((item) => {
        if (Buffer.isBuffer(item)) {
          images.push(item)
        } else {
          tasks.push(this.getImageBuffer(item))
        }
      })
    }

    /**
     * 消息中的图片
     */
    if (imagesInMessage.length > 0) {
      tasks.push(...imagesInMessage.map((imageUrl) => this.getImageBuffer(imageUrl)))
    }

    const results = await Promise.allSettled(tasks)
    results.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        images.push(res.value)
      }
    })

    return images.slice(0, max_images)
  },

  /**
 * 获取引用消息
 */
  async getQuotedImages (e) {
    let source = null


    if (e.getReply) {
      source = await e.getReply()
    } else if (e.source) {
      if (e.group?.getChatHistory) {
        source = (await e.group.getChatHistory(e.source.seq, 1)).pop()
      } else if (e.friend?.getChatHistory) {
        source = (await e.friend.getChatHistory(e.source.time, 1)).pop()
      }
    }

    if (!source || !source.message || !Array.isArray(source.message)) {
      return []
    }

    const imgArr = source.message
      .filter((msg) => msg.type === 'image')
      .map((img) => img.url)

    const hasOtherTypes = source.message.some((msg) => msg.type !== 'image')
    const isSelfMessage = source.sender?.user_id === e.sender.user_id

    if (isSelfMessage && imgArr.length > 0) {
      return imgArr
    }

    if (imgArr.length > 0 && !hasOtherTypes) {
      return imgArr
    }

    if (source.sender?.user_id) {
      try {
        const avatarBuffers = await this.getAvatar([source.sender.user_id], e)
        if (Array.isArray(avatarBuffers) && avatarBuffers.length > 0) {
          return avatarBuffers
        }
      } catch (error) {
        throw {
          status: 400,
          message: '获取引用消息失败，请稍后再试。'
        }
      }
    }

    return []
  },
  /**
   * 处理错误异常信息
   */
  async handleError (error) {
    const { status, message } = error

    switch (status) {
      case 400:
        return message
      case 404:
        return message || '资源不存在'
      case 500:
        return '表情服务请求失败，请稍后再试。'
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
      case 560:
        return message.detail
    }
  }
}

export default Utils