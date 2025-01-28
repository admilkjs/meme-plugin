import fs from 'node:fs'
import _ from 'lodash'
import Data from './Data.js'
import cfg from '../../../lib/config/config.js'
import { fileURLToPath } from 'url'
import { join, dirname, basename } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const Path = process.cwd().replace(/\\/g, '/')
const Plugin_Path = join(__dirname, '..').replace(/\\/g, '/')
const Plugin_Name = basename(Plugin_Path)

let packageJson = {}
packageJson = await Data.readJSON('package.json', `${Path}`)

let changelogs = []
let currentVersion = ''
const versionCount = 3

function getLine (line) {
  const patterns = [
    { regex: new RegExp('\\s*`([^`]+)`', 'g'), replacement: '<span class="cmd">$1</span>' },
    { regex: new RegExp('\\*\\*\\s*([^*]+)\\s*\\*\\*', 'g'), replacement: '<span class="strong">$1</span>' },
    { regex: new RegExp('\\(\\[([^\\]]+)\\]\\(([^)]+)\\)\\)', 'g'), replacement: '<span class="link">$1</span>' }
  ]

  patterns.forEach(({ regex, replacement }) => {
    line = line.replace(regex, replacement)
  })

  return line
}
const CHANGELOG_path = `${Plugin_Path}/CHANGELOG.md`



try {
  if (fs.existsSync(CHANGELOG_path)) {
    const logs = fs.readFileSync(CHANGELOG_path, 'utf8') || ''
    const lines = logs.replace(/\t/g, '   ').split('\n')
    let temp = {}
    let lastCategory = {}

    _.forEach(lines, (line) => {
      if (changelogs.length >= versionCount) return false

      const versionMatch = /^##?\s*\[?([0-9a-zA-Z\\.~\s]+)]?(?:$([^)]+)$)?/.exec(line.trim())
      if (versionMatch && versionMatch[1]) {
        if (temp.version) {
          changelogs.push(temp)
        }
        temp = {
          version: versionMatch[1].trim(),
          logs: []
        }

        lastCategory = {}
        return
      }

      const categoryMatch = /^###\s+(.*)/.exec(line.trim())
      if (categoryMatch && categoryMatch[1]) {
        lastCategory = { title: getLine(categoryMatch[1]), logs: [] }
        temp.logs.push(lastCategory)
        return
      }

      const logMatch = /^\s*[\*\-]\s+(.*)/.exec(line)
      if (logMatch && logMatch[1]) {
        const logItem = getLine(logMatch[1])
        if (lastCategory.logs) {
          lastCategory.logs.push(logItem)
        } else {
          temp.logs.push({ title: '', logs: [logItem] })
        }
        return
      }
    })

    if (temp.version && changelogs.length < versionCount) {
      changelogs.push(temp)
    }

    if (changelogs.length > 0) {
      currentVersion = changelogs[0].version
      changelogs[0].version += ' <span class="new"></span>'
    }
  }
} catch (err) {
}


let BotName = cfg.package.name

switch (BotName) {
  case 'miao-yunzai':
    BotName = 'Miao-Yunzai'
    break
  case 'yunzai':
    BotName = 'Yunzai-Bot'
    break
  case 'trss-yunzai':
    BotName = 'TRSS-Yunzai'
    break
  default:
    BotName = _.capitalize(BotName)
}


const Version = {
  get Bot_Name () {
    return BotName
  },
  get Bot_Version () {
    return packageJson.version
  },
  get Bot_Path () {
    return Path
  },
  get Plugin_Logs () {
    return changelogs
  },
  get Plugin_Path () {
    return Plugin_Path
  },
  get Plugin_Name () {
    return Plugin_Name
  },
  get Plugin_AliasName () {
    return '清语表情'
  },
  get Plugin_Version () {
    return currentVersion
  }
}

export default Version

