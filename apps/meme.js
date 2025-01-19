import { Config } from '#components'
import { Meme, Tools } from '#models'

export class meme extends plugin {
  constructor () {
    super({
      name: '清语表情:表情包生成',
      event: 'message',
      priority: -Infinity,
      rule: []
    })

    this.rulesInitialized = false
    this.initRules()
  }

  initRules () {
    if (this.rulesInitialized) {
      return
    }

    this.rule = this.rule.filter((r) => r.fnc !== 'meme')
    const prefix = Config.meme.forceSharp ? '^#' : '^#?'

    Object.entries(Tools.getInfoMap()).forEach(([key, value]) => {
      value.keywords.forEach((keyword) => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`${prefix}(${escapedKeyword})(.*)`, 'i')

        this.rule.push({
          reg: regex,
          fnc: 'meme'
        })
      })
    })

    this.rulesInitialized = true
  }

  async meme (e) {
    if (!Config.meme.Enable) return false

    const message = e.msg.trim()
    let matchedKeyword

    this.rule.some(rule => {
      const match = message.match(rule.reg)
      if (match) {
        matchedKeyword = match[1]
        return true
      }
      return false
    })

    if (!matchedKeyword) return true

    const memeKey = await Tools.getKey(matchedKeyword)

    if (!memeKey) {
      return true
    }

    /**
     * 用户权限检查
     */
    if (Config.access.enable) {
      if (Config.access.mode === 0) {
        if (!Config.access.userWhiteList.includes(e.user_id)) {
          return true
        }
      } else if (Config.access.mode === 1) {
        if (Config.access.userBlackList.includes(e.user_id)) {
          return true
        }
      }
    }

    /**
     * 禁用表情列表
     */
    if (Config.access.blackListEnable && await Tools.isBlacklisted(matchedKeyword)) {
      logger.info('[清语表情]该表情为禁用表情, 跳过生成')
      return false
    }

    const params = Tools.getParams(memeKey)
    if (!params) {
      return true
    }

    const { min_texts, max_texts, min_images, max_images, default_texts, args_type } = params
    const userText = message.replace(new RegExp(`^#?${matchedKeyword}`, 'i'), '').trim()

    /**
     * 防误触发处理
     */
    if (min_texts === 0 && max_texts === 0) {
      if (userText && !/^(@\s*\d+\s*)+$/.test(userText.trim())) {
        return false
      }
    }

    return await Meme.make(e, memeKey, min_texts, max_texts, min_images, max_images, default_texts, args_type, userText)
  }

}
