import { Utils, Tools } from '#models'
import { Config } from '#components'

async function handleImages (e, memeKey, userText, min_images, max_images, formData) {
  let images = []
  let userAvatars = []


  const atsInMessage = e.message
    .filter((m) => m.type === 'at')
    .map((at) => at.qq)

  const manualAts = [...userText.matchAll(/@\s*(\d+)/g)].map((match) => match[1])
  userAvatars = [...new Set([...atsInMessage, ...manualAts])]
  userText = userText.replace(/@\s*\d+/g, '').trim()

  if (userAvatars.length > 0) {
    const avatarBuffers = await Utils.getAvatar(userAvatars, e)
    avatarBuffers.forEach((avatar) => {
      if (avatar) images.push(avatar)
    })
  }

  if (images.length < max_images) {
    const fetchedImages = await Utils.getImage(e, userText, max_images - images.length)
    images = images.concat(fetchedImages)
  }

  /**
   * 这里是为表情保护准备的
   */
  if (min_images === 1) {
    const triggerAvatar = await Utils.getAvatar([e.user_id], e)
    if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0]) {
      images.push(triggerAvatar[0])
    }
  }

  if (images.length < min_images) {
    const triggerAvatar = await Utils.getAvatar([e.user_id], e)
    if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0]) {
      images.unshift(triggerAvatar[0])
    }
  }

  /**
   * 表情保护逻辑
   */
  if (Config.protect.enable) {
    const isProtected = await Tools.isProtected(memeKey, Config.protect.list)

    if (isProtected) {
      if (Config.protect.master && !e.isMaster) {
        images.reverse()
      } else if (Config.protect.userEnable && Config.protect.user.includes(e.user_id)) {
        images.reverse()
        const triggerAvatar = await Utils.getAvatar([e.user_id], e)
        if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0] && images[0] === triggerAvatar[0]) {
          images.reverse()
        }
      }
    }
  }

  images.slice(0, max_images).forEach((buffer, index) => {
    formData.append('images', buffer, `image${index}.png`)
  })

  if (images.length < min_images) {
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
