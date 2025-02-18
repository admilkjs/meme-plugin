import lodash from 'lodash'

import { Render, Version } from '#components'
import { Help } from '#models'

export class help extends plugin {
  constructor () {
    super({
      name: '清语表情:帮助',
      event: 'message',
      priority: -Infinity,
      rule: [
        {
          reg: /^#?(?:(清语)?表情|(?:clarity-)?meme)(?:命令|帮助|菜单|help|说明|功能|指令|使用说明)$/i,
          fnc: 'help'
        },
        {
          reg: /^#?(?:(清语)?表情|(?:clarity-)?meme)(?:版本|版本信息|version|versioninfo)$/i,
          fnc: 'versionInfo'
        }
      ]
    })
  }

  async help (e) {
    let helpGroup = []
    lodash.forEach(Help.helpList.List, (group) => {
      if (group.auth && group.auth === 'master' && !e.isMaster) {
        return true
      }
      lodash.forEach(group.list, (help) => {
        let icon = help.icon * 1
        if (!icon) {
          help.css = 'display:none'
        } else {
          let x = (icon - 1) % 10
          let y = (icon - x - 1) / 10
          help.css = `background-position:-${x * 50}px -${y * 50}px`
        }
      })

      helpGroup.push(group)
    })
    const themeData = await Help.Theme.getThemeData(Help.helpCfg.Cfg)
    const img = await Render.render(
      'help/index',
      {
        helpCfg: Help.helpCfg.Cfg,
        helpGroup,
        ...themeData
      }
    )
    await e.reply(img)
    return true
  }

  async versionInfo (e) {
    const img = await Render.render(
      'help/version-info',
      {
        currentVersion: Version.Plugin_Version,
        changelogs: Version.Plugin_Logs
      }
    )
    await e.reply(img)
    return true
  }
}
