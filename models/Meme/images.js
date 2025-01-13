import Utils from '../utils.js'
async function handleImages (e, userText, min_images, max_images, formData) {
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

  images.forEach((buffer, index) => {
    formData.append('images', buffer, `image${index}.jpg`)
  })

  if (images.length < min_images) {
    return false
  }

  return images.slice(0, max_images)
}

export { handleImages }