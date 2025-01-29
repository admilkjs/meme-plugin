import YAML from 'yaml'
import chokidar from 'chokidar'
import fs from 'node:fs'
import path from 'node:path'
import YamlReader from './YamlReader.js'
import _ from 'lodash'
import Version from './Version.js'
import cfgSchema from '../config/system/cfg_system.js'
import cfg from '../../../lib/config/config.js'

class Config {
  constructor () {
    this.config = {}
    this.watcher = {}

    this.dirCfgPath = `${Version.Plugin_Path}/config/config/`
    this.defCfgPath = `${Version.Plugin_Path}/config/defSet/`

    this.initCfg()
  }

  /** 初始化配置 */
  initCfg () {
    if (!fs.existsSync(this.dirCfgPath)) fs.mkdirSync(this.dirCfgPath)

    const files = fs
      .readdirSync(this.defCfgPath)
      .filter((file) => file.endsWith('.yaml'))

    for (let file of files) {
      const name = path.basename(file, '.yaml')
      if (!fs.existsSync(`${this.dirCfgPath}${file}`)) {
        fs.copyFileSync(`${this.defCfgPath}${file}`, `${this.dirCfgPath}${file}`)
      }
      this.watch(`${this.dirCfgPath}${file}`, name, 'config')
    }
  }

  /** 主人QQ */
  get masterQQ () {
    return cfg.masterQQ
  }

  /** 表情设置 */
  get meme () {
    return this.getDefOrConfig('meme')
  }

  /** 权限设置 */
  get access (){
    return this.getDefOrConfig('access')
  }

  /** 保护设置 */
  get protect () {
    return this.getDefOrConfig('protect')
  }

  /** 统计设置 */
  get stats () {
    return this.getDefOrConfig('stats')
  }

  /** 自定义设置 */
  get custom () {
    return this.getDefOrConfig('custom')
  }

  /** 其他设置 */
  get other () {
    return this.getDefOrConfig('other')
  }

  /** 读取默认或用户配置 */
  getDefOrConfig (name) {
    return { ...this.getdefSet(name), ...this.getConfig(name) }
  }

  /** 默认配置 */
  getdefSet (name) {
    return this.getYaml('defSet', name)
  }

  /** 用户配置 */
  getConfig (name) {
    return this.getYaml('config', name)
  }

  /** 获取 YAML 配置 */
  getYaml (type, name) {
    let filePath = `${Version.Plugin_Path}/config/${type}/${name}.yaml`
    let key = `${type}.${name}`

    if (this.config[key]) return this.config[key]

    this.config[key] = YAML.parse(fs.readFileSync(filePath, 'utf8'))
    this.watch(filePath, name, type)

    return this.config[key]
  }

  /** 监听配置文件 */
  watch (file, name, type = 'config') {
    let key = `${type}.${name}`
    if (this.watcher[key]) return

    const watcher = chokidar.watch(file)
    watcher.on('change', async () => {
      const oldConfig = _.cloneDeep(this.config[key] || {})

      delete this.config[key]
      const newConfig = this.getYaml(type, name)

      logger.mark(`[清语表情][修改配置文件][${type}][${name}]`)

      const object = this.findDifference(oldConfig, newConfig)
      for (const key in object) {
        if (Object.hasOwnProperty.call(object, key)) {
          const value = object[key]
          const arr = key.split('.')
          if (arr[0] !== 'servers') continue
          let data = newConfig.servers[arr[1]] || oldConfig.servers[arr[1]]

          const target = {
            type: null,
            data
          }
          if (typeof value.newValue === 'object' && typeof value.oldValue === 'undefined') {
            target.type = 'add'
          } else if (typeof value.newValue === 'undefined' && typeof value.oldValue === 'object') {
            target.type = 'del'
          } else if (value.newValue === true && (value.oldValue === false || typeof value.oldValue === 'undefined')) {
            target.type = 'close'
          } else if (value.newValue === false && (value.oldValue === true || typeof value.oldValue === 'undefined')) {
            target.type = 'open'
          }

          await modifyWebSocket(target)
        }
      }
    })

    this.watcher[key] = watcher
  }

  /** 获取配置 Schema 映射 */
  getCfgSchemaMap () {
    let ret = {}
    _.forEach(cfgSchema, (cfgGroup) => {
      _.forEach(cfgGroup.cfg, (cfgItem, cfgKey) => {
        ret[cfgItem.key] = cfgItem
        cfgItem.cfgKey = cfgKey
      })
    })
    return ret
  }

  /** 获取所有配置 */
  getCfg () {
    return {
      ...this.getDefOrConfig('other'),
      ...this.getDefOrConfig('meme'),
      ...this.getDefOrConfig('access'),
      ...this.getDefOrConfig('protect')
    }
  }

  /** 修改配置 */
  modify (name, key, value, type = 'config') {
    let filePath = `${Version.Plugin_Path}/config/${type}/${name}.yaml`
    new YamlReader(filePath).set(key, value)
    delete this.config[`${type}.${name}`]
  }

  /** 修改配置数组 */
  modifyarr (name, key, value, category = 'add', type = 'config') {
    let filePath = `${Version.Plugin_Path}/config/${type}/${name}.yaml`
    let yaml = new YamlReader(filePath)
    if (category === 'add') {
      yaml.addIn(key, value)
    } else {
      let index = yaml.jsonData[key].indexOf(value)
      yaml.delete(`${key}.${index}`)
    }
  }

  /** 修改数组中的某个元素 */
  setArr (name, key, item, value, type = 'config') {
    let filePath = `${Version.Plugin_Path}/config/${type}/${name}.yaml`
    let yaml = new YamlReader(filePath)
    let arr = yaml.get(key).slice()
    arr[item] = value
    yaml.set(key, arr)
  }

  /** 对比两个对象的不同值 */
  findDifference (obj1, obj2, parentKey = '') {
    const result = {}
    for (const key in obj1) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key
      if (_.isObject(obj1[key]) && _.isObject(obj2[key])) {
        const diff = this.findDifference(obj1[key], obj2[key], fullKey)
        if (!_.isEmpty(diff)) {
          Object.assign(result, diff)
        }
      } else if (!_.isEqual(obj1[key], obj2[key])) {
        result[fullKey] = { oldValue: obj1[key], newValue: obj2[key] }
      }
    }
    for (const key in obj2) {
      if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key
        result[fullKey] = { oldValue: undefined, newValue: obj2[key] }
      }
    }
    return result
  }
}

export default new Config()
