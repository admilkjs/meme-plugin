import { Version, Config, Render } from '#components'
import { update as Update } from '../../other/update.js'
import { Utils, Code } from '#models'
import { meme } from './meme.js'
import pluginsLoader from '../../../lib/plugins/loader.js'
import chalk from 'chalk'

export class update extends plugin {
  constructor () {
    super({
      name: '清语表情:更新',
      event: 'message',
      priority: -Infinity,
      rule: [
        {
          reg: /^#?(清语表情|clarity-meme)(插件)?(强制)?更新$/i,
          fnc: 'update'
        },
        {
          reg: /^#?(清语表情|clarity-meme)更新日志$/i,
          fnc: 'updateLog'
        },
        {
          reg: /^#?(清语表情|clarity-meme)更新(表情包)?(资源|数据)$/i,
          fnc: 'updateRes'
        },
        {
          reg: /^#?(清语表情|clarity-meme)检查更新$/i,
          fnc: 'checkUpdate'
        }
      ]
    })

    this.task = []

    if (Config.other.checkRepo) {
      this.task.push({
        name: '清语表情:仓库更新检测',
        cron: '0 0/20 * * * ?',
        log: false,
        fnc: async () => {
          await this.checkUpdate(null, true)
        }
      })
    }

    if (Config.meme.autoRes) {
      this.task.push({
        name: '清语表情:表情包数据每日更新',
        cron: '0 20 0 * * ?',
        log: false,
        fnc: async () => {
          await this.updateRes(null, true)
        }
      })
    }

    this.e = {
      isMaster: true,
      logFnc: '[清语表情]自动更新]',
      msg: `#更新${Version.Plugin_Name}`,
      reply: async (msg) => {
        const masters = Object.keys(Config.masterQQ)
        for (const master of masters) {
          if (master.toString().length > 11) {
            logger.info('[清语表情] 更新推送跳过 QQBot')
            continue
          }
          try {
            await Bot.pickFriend(master).sendMsg(msg)
            await Bot.sleep(2000)
          } catch (err) {
            logger.error(`[清语表情] 向好友 ${master} 发送消息时出错：`, err)
          }
        }
      }
    }

    if (Config.other.autoUpdate) {
      this.task.push({
        name: '清语表情:自动更新',
        cron: Config.other.autoUpdateCron,
        fnc: () => this.update(this.e)
      })
    }
  }

  async update (e) {
    const Type = e.msg.includes('强制') ? '#强制更新' : '#更新'
    if (e) e.msg = Type + Version.Plugin_Name
    const up = new Update(e)
    up.e = e
    return up.update()
  }

  async updateLog (e = this.e) {
    if (e) e.msg = '#更新日志' + Version.Plugin_Name
    const up = new Update(e)
    up.e = e
    return up.updateLog()
  }

  async updateRes (e, isTask = false) {
    if (!isTask && !e.isMaster) {
      await e.reply('只有主人才能更新表情包数据')
      return
    }

    if (!isTask && e) {
      await e.reply(`[${Version.Plugin_AliasName}] 开始更新表情包数据中, 请稍后...`)
    }

    try {
      await Utils.Tools.generateMemeData(true)
      const Plugin = new meme()
      const pluginName = Plugin.name
      const pluginKey = pluginsLoader.priority.find((p) => {
        if (p.plugin) {
          return p.plugin.name === pluginName
        } else if (p.class) {
          return p.name === pluginName
        }
        return false
      })
      let pluginInfo
      if (pluginKey.plugin) {
        pluginInfo = pluginKey.plugin
      } else {
        pluginInfo = new pluginKey.class()
      }
      await pluginInfo.updateRegExp()

      if (!isTask && e) {
        await e.reply(`[${Version.Plugin_AliasName}] 表情包数据更新完成`)
      }
      logger.mark(chalk.rgb(255, 165, 0)('✅ 表情包数据更新完成 🎉'))
      return true
    } catch (error) {
      if (!isTask && e) {
        await e.reply(`表情包数据更新失败: ${error.message}`)
      }
      logger.error(`表情包数据更新出错: ${error.message}`)
      return false
    }
  }


  async checkUpdate (e, isTask = false) {
    try {
      const { owner, repo, currentBranch } = await Code.gitRepo.getRepo()
      const latestCommit = await Code.commit.getLatestCommit(owner, repo, currentBranch)
      const remoteSHA = latestCommit.sha
      const shaKey = `Yz:${Version.Plugin_Name}:update:commit:${currentBranch}`
      const localSHA = await Code.check.getLocalCommit(Version.Plugin_Path)

      if (!localSHA) {
        throw new Error('无法获取本地 commit SHA，更新检查失败！')
      }

      let storedSHA = await redis.get(shaKey)
      if (!storedSHA) {
        storedSHA = remoteSHA
        await redis.set(shaKey, remoteSHA)
      }

      if (localSHA === remoteSHA) {
        if (storedSHA === remoteSHA) {
          if (!isTask && e) {
            await e.reply('当前已是最新版本，无需更新。')
          }
          return
        } else {
          await redis.set(shaKey, remoteSHA)
          if (!isTask && e) {
            await e.reply('Redis 已更新为最新版本。')
          }
          return
        }
      }

      const commitInfo = {
        committer: latestCommit.committer.login,
        commitTime: latestCommit.commitTime,
        title: latestCommit.message.title,
        content: latestCommit.message.content,
        commitUrl: latestCommit.commitUrl
      }

      const img = await Render.render('code/index', {
        commitInfo,
        branchName: currentBranch
      })

      if (isTask) {
        const masterQQs = Config.masterQQ.filter(qq => {
          const qqStr = String(qq)
          return qqStr.length <= 11 && qqStr !== 'stdin'
        })

        if (masterQQs.length > 0) {
          for (let qq of masterQQs) {
            try {
              await Bot.pickFriend(qq).sendMsg(img)
              break
            } catch (sendError) {
              logger.info(`发送消息给 ${qq} 失败: ${sendError.message}`)
            }
          }
        }
      } else if (e) {
        await e.reply(img)
      }

      await redis.set(shaKey, remoteSHA)

    } catch (error) {
      logger.error(`更新检查失败: ${error.message}`)
      if (!isTask && e) {
        await e.reply(`更新检查失败: ${error.message}`)
      }
    }
  }


}
