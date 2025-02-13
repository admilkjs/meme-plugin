import { meme } from '../db/index.js'

export const getMemeList = async () => {
  const keywordsRaw = await meme.getAllSelect('keyWords')

  const keywords = Array.from(new Set(
    keywordsRaw.flatMap(item => {
      try {
        return JSON.parse(item)
      } catch (e) {
        return []
      }
    })
  ))

  const keywordPromises = keywords.map(async keyword => ({
    label: keyword,
    value: (await meme.getByField('keyWords', keyword)).toString()
  }))

  return Promise.all(keywordPromises)
}
