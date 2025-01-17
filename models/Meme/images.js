import { Utils, Tools } from '#models'
import { Config } from '#components'

async function handleImages (e, memeKey, userText, min_images, max_images, formData) {
  let messageImages = []
  let userAvatars = []

  const atsInMessage = e.message
    .filter((m) => m.type === 'at')
    .map((at) => at.qq)


  const manualAts = [...userText.matchAll(/@\s*(\d+)/g)].map((match) => match[1])
  const allMentionedUsers = [...new Set([...atsInMessage, ...manualAts])]

  userText = userText.replace(/@\s*\d+/g, '').trim()


  if (allMentionedUsers.length > 0) {
    const avatarBuffers = await Utils.getAvatar(allMentionedUsers, e)
    userAvatars = avatarBuffers.filter(Boolean)
  }


  const fetchedImages = await Utils.getImage(e)
  messageImages = fetchedImages

  /**
   * 特殊处理：当 min_images === 1 时，因没有多余的图片，表情保护会失效
   */
  if (min_images === 1 && messageImages.length === 0) {
    const triggerAvatar = await Utils.getAvatar([e.user_id], e)
    if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0]) {
      userAvatars.push(triggerAvatar[0])
    }
  }

  if (messageImages.length + userAvatars.length < min_images) {
    const triggerAvatar = await Utils.getAvatar([e.user_id], e)
    if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0]) {
      userAvatars.unshift(triggerAvatar[0])
    }
  }

  /**
   * 表情保护逻辑
   */
  if (Config.protect.enable) {
    const isProtected = await Tools.isProtected(memeKey, Config.protect.list)

    if (isProtected) {
      if (messageImages.length === 0) {
        if (Config.protect.master && !e.isMaster) {
          userAvatars.reverse()
        } else if (Config.protect.userEnable && Config.protect.user.includes(e.user_id)) {
          userAvatars.reverse()
          const triggerAvatar = await Utils.getAvatar([e.user_id], e)
          if (
            triggerAvatar &&
            Array.isArray(triggerAvatar) &&
            triggerAvatar[0] &&
            userAvatars[0] === triggerAvatar[0]
          ) {
            userAvatars.reverse()
          }
        }
      }
    }
  }

  const finalImages = [...messageImages, ...userAvatars].slice(0, max_images)
  finalImages.forEach((buffer, index) => {
    formData.append('images', buffer, `image${index}.png`)
  })


  if (finalImages.length < min_images) {
    return {
      success: false,
      userText: userText
    }
  }

  return {
    success: true,
    userText: userText
  }
}

export { handleImages }
