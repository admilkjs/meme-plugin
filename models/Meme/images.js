import { Utils } from '#models'

async function handleImages (e, memeKey, userText, min_images, max_images, allUsers, formData) {
  let messageImages = []
  let userAvatars = []

  if (allUsers.length > 0) {
    const avatarBuffers = await Utils.Common.getAvatar(e, allUsers)
    userAvatars.push(...avatarBuffers.filter(Boolean))
  }

  const fetchedImages = await Utils.Common.getImage(e)
  messageImages.push(...fetchedImages)

  if (messageImages.length + userAvatars.length < min_images) {
    const triggerAvatar = await Utils.Common.getAvatar(e, [ e.user_id ])
    if (triggerAvatar[0]) {
      userAvatars.unshift(triggerAvatar[0])
    }
  }

  let finalImages = [ ...userAvatars, ...messageImages ].slice(0, max_images)

  finalImages.forEach((buffer, index) => {
    const blob = new Blob([ buffer ], { type: 'image/png' })
    formData.append('images', blob, `image${index}.png`)
  })

  if (finalImages.length < min_images) {
    return {
      success: false,
      userText: userText,
      message: `该表情需要${min_images} ~ ${max_images}张图片`
    }
  }

  return {
    success: true,
    userText: userText
  }
}

export { handleImages }
