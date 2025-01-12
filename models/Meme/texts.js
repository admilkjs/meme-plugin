import { Config } from '#components'
import Utils from '../utils.js'

export async function handleTexts (e, userText, memeInfo, min_texts, max_texts, formData) {
  let finalTexts = []

  if (!(min_texts === 0 && max_texts === 0)) {
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
    else if (finalTexts.length === 0 && memeInfo && memeInfo.defaultTexts && memeInfo.defaultTexts.length > 0) {
      const randomIndex = Math.floor(Math.random() * memeInfo.defaultTexts.length)
      finalTexts.push(memeInfo.defaultTexts[randomIndex])
    }

    if (finalTexts.length < min_texts) {
      return false
    }

    finalTexts.forEach((text) => {
      formData.append('texts', text)
    })
  }

  return finalTexts
}
