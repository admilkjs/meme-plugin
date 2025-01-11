import Utils from '../utils.js'
import { Config } from '#components'
import Tools from '../tools.js'

export async function handleImages (e, memeKey, userText, min_images, max_images, formData) {
  let images = []
  let userAvatars = []

  const atMatches = userText.matchAll(/@\s*(\d+)/g)
  for (const match of atMatches) {
    userAvatars.push(match[1])
  }
  userText = userText.replace(/@\s*\d+/g, '').trim()

  if (userAvatars.length > 0) {
    const avatarBuffers = await Utils.getAvatar(userAvatars)
    if (avatarBuffers) {
      avatarBuffers.forEach(avatarList => {
        if (Array.isArray(avatarList)) {
          avatarList.forEach(avatar => {
            if (avatar) images.push(avatar)
          })
        } else if (avatarList) {
          images.push(avatarList)
        }
      })
    }

    if (images.length < min_images) {
      const triggerAvatar = await Utils.getAvatar([e.user_id])
      if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0]) images.unshift(triggerAvatar[0])
    }
  } else {
    const fetchedImages = await Utils.getImage(e, userText, max_images)
    images = fetchedImages
    if (images.length < min_images) {
      const triggerAvatar = await Utils.getAvatar([e.user_id])
      if (triggerAvatar && Array.isArray(triggerAvatar) && triggerAvatar[0]) images.unshift(triggerAvatar[0])
    }
  }

  if (Config.protect.enable && min_images === 2) {
    const ats = e.message.filter((m) => m.type === 'at').map((at) => at.qq)
    const manualAtQQs = [...userText.matchAll(/@(\d{5,11})/g)].map(
      (match) => match[1]
    )
    const allAtQQs = [...new Set([...ats, ...manualAtQQs])]

    let isMaster = false
    let isUserAuthorized = false
    let isProtectedMeme = false

    if (Config.protect.master) {
      const masterQQ = Array.isArray(Config.protect.MasterQQ)
        ? Config.protect.MasterQQ
        : [Config.protect.MasterQQ]

      isMaster = allAtQQs.some((userId) => masterQQ.includes(userId))
    }

    if (Config.protect.userEnable) {
      const authorizedUsers = Config.protect.user || []
      isUserAuthorized = allAtQQs.some((userId) => authorizedUsers.includes(userId))
    }

    const protectedMemeKeys = await Promise.all(
      Config.protect.list.map(async (item) => await Tools.getKey(item) || item)
    )
    isProtectedMeme = protectedMemeKeys.includes(memeKey)

    if (isProtectedMeme && (isMaster || isUserAuthorized)) {
      images.reverse().forEach((buffer, index) => {
        formData.append('images', buffer, `image${index}.jpg`)
      })
    } else {
      images.forEach((buffer, index) => {
        formData.append('images', buffer, `image${index}.jpg`)
      })
    }
  } else {
    images.forEach((buffer, index) => {
      formData.append('images', buffer, `image${index}.jpg`)
    })
  }

  if (images.length < min_images) {
    return false
  }

  return images.slice(0, max_images)
}
