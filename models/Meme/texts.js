import { Config } from '#components'
import { Utils } from '#models'

async function handleTexts (e, userText, memeInfo, min_texts, max_texts) {
  let finalTexts = []

  if (userText) {
    const splitTexts = userText.split('/').map((text) => text.trim())
    finalTexts = splitTexts.slice(0, max_texts)
  }

  const ats = e.message.filter((m) => m.type === 'at').map((at) => at.qq)
  if (finalTexts.length === 0 && Config.meme.userName) {
    if (ats.length >= 1) {
      const User = ats[0]
      const Nickname = await Utils.getNickname(User, e)
      finalTexts.push(Nickname)
    } else {
      const Nickname = await Utils.getNickname(e.sender.user_id, e)
      finalTexts.push(Nickname)
    }
  }

  if (
    finalTexts.length < min_texts &&
    memeInfo.params_type.default_texts &&
    memeInfo.params_type.default_texts.length > 0
  ) {
    const defaultTexts = memeInfo.params_type.default_texts
    while (finalTexts.length < min_texts) {
      const randomIndex = Math.floor(Math.random() * defaultTexts.length)
      finalTexts.push(defaultTexts[randomIndex])
    }
  }

  if (finalTexts.length < min_texts) {
    return false
  }

  finalTexts.slice(0, max_texts).forEach((text) => {
    formData.append('texts', text)
  })

  return finalTexts
}

export { handleTexts }
