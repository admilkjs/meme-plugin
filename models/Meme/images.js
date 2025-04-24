import { Utils } from '#models'

async function handleImages (e, memeKey, userText, min_images, max_images, allUsers, formData) {
  const messageImages = await Utils.Common.getImage(e)
  let userAvatars = []

  if (allUsers.length > 0) {
    const avatarBuffers = await Utils.Common.getAvatar(e, allUsers)
    userAvatars = avatarBuffers.filter(Boolean)
  }

  if (messageImages.length + userAvatars.length < min_images) {
    const [ triggerAvatar ] = await Utils.Common.getAvatar(e, [ e.user_id ])
    if (triggerAvatar) {
      userAvatars.unshift(triggerAvatar)
    }
  }

  const finalImages = [ ...userAvatars, ...messageImages ].slice(0, max_images)

  finalImages.forEach((buffer, index) => {
    formData.append('images', new Blob([ buffer ], { type: 'image/png' }), `image${index}.png`)
  })

  return finalImages.length < min_images
    ? {
      success: false,
      userText,
      message: `该表情需要${min_images} ~ ${max_images}张图片`
    }
    : {
      success: true,
      userText
    }
}

export { handleImages }
