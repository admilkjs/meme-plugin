import fs from 'node:fs/promises'
import { Data, Version, Config } from '../../components/index.js'
import Request from './request.js'

const Tools = {
  infoMap: null,
  loaded: false,
  baseUrl: null,
  /**
   * 检查指定的文件是否存在
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} - 如果文件存在返回 true，否则返回 false
   */
  async fileExistsAsync (filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  },

  /**
   * 判断是否在海外环境
   * @returns {Promise<boolean>} - 如果在海外环境返回 true，否则返回 false
   */
  async isAbroad () {
    const urls = [
      'https://blog.cloudflare.com/cdn-cgi/trace',
      'https://developers.cloudflare.com/cdn-cgi/trace'
    ]

    try {
      const response = await Promise.any(urls.map(url => Request.get(url, {}, 'text')))
      const traceMap = Object.fromEntries(
        response.split('\n').filter(line => line).map(line => line.split('='))
      )
      return traceMap.loc !== 'CN'
    } catch (error) {
      throw {
        status: 500,
        message: `获取IP所在地区出错: ${error.message}`
      }
    }
  },

  /**
   * 获取表情包请求的基础 URL
   * @returns {Promise<string>} - 返回表情包基础 URL
   */
  async getBaseUrl () {
    if (Config.meme.url) {
      this.baseUrl = Config.meme.url.replace(/\/+$/, '')
      return this.baseUrl
    }

    return this.baseUrl = 'https://meme.wuliya.cn'
  },

  /**
   * 加载表情包数据
   * 如果数据已加载则直接返回，否则从本地或远程加载表情包数据
   * @returns {Promise<void>}
   */
  async load () {
    if (this.loaded) {
      return
    }
    if (!(await this.fileExistsAsync('data/meme.json'))) {
      await this.generateMemeData()
    }
    this.infoMap = await Data.readJSON('data/meme.json')

    if (!this.infoMap || typeof this.infoMap !== 'object') {
      return
    }

    this.loaded = true
  },

  /**
   * 发送表情包生成请求
   * @param {string} endpoint - API 的路径
   * @param {object} params - 请求参数
   * @param {string} method - HTTP 请求方法 (默认是 GET)
   * @param {string|null} responseType - 响应类型 (例如 'json', 'text')
   * @returns {Promise<any>} - 返回响应结果
   */
  async request (endpoint, params = {}, method = 'GET', responseType = null) {
    const baseUrl = await this.getBaseUrl()
    const url = `${baseUrl}/${endpoint}`

    try {
      if (method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD') {
        return await Request.get(url, params, responseType)
      } else {
        return await Request.post(url, params, responseType)
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * 获取表情包的预览图片地址
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {Promise<string|null>} - 返回预览图片的 URL 或 null
   */
  async getPreviewUrl (memeKey) {
    if (!memeKey) {
      throw new Error('表情键值不能为空')
    }

    try {
      const baseUrl = await this.getBaseUrl()
      return `${baseUrl}/memes/${memeKey}/preview`
    } catch (error) {
      throw error
    }
  },

  /**
   * 生成本地表情包数据
   * @param {boolean} forceUpdate - 是否强制更新数据
   * @returns {Promise<void>}
   */
  async generateMemeData (forceUpdate = false) {
    try {
      const filePath = `${Version.Plugin_Path}/data/meme.json`
      await Data.createDir('data', '', false)

      if (await this.fileExistsAsync(filePath) && !forceUpdate) {
        return
      }
      if (forceUpdate && await this.fileExistsAsync(filePath)) {
        await fs.unlink(filePath)
      }

      const baseUrl = await this.getBaseUrl()
      if (!baseUrl) {
        throw new Error('无法获取表情包请求基础路径')
      }

      const keysResponse = await Request.get(`${baseUrl}/memes/keys`)

      const memeDataArray = await Promise.all(
        keysResponse.map(async (key) => {
          try {
            const infoResponse = await Request.get(`${baseUrl}/memes/${key}/info`)
            return { key, info: infoResponse }
          } catch (error) {
            logger.error(`获取 表情 详情失败: ${key} - ${error.message}`)
            return null
          }
        })
      )

      const memeData = Object.fromEntries(
        memeDataArray.filter(Boolean).map(({ key, info }) => [key, info])
      )

      await Data.writeJSON('data/meme.json', memeData, 2)
    } catch (error) {
      logger.error(`生成本地表情包数据失败: ${error.message}`)
      throw error
    }
  },

  /**
   * 获取所有表情包的信息
   * @returns {object|null} - 返回表情包信息映射表
   */
  getInfoMap () {
    return this.infoMap || null
  },

  /**
   * 获取指定表情包的信息
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {object|null} - 返回表情包的信息或 null
   */
  getInfo (memeKey) {
    return this.infoMap[memeKey] || null
  },

  /**
   * 将关键字转换为表情包键
   * @param {string} keyword - 表情包关键字
   * @returns {string|null} - 返回对应的表情包键或 null
   */
  getKey (keyword) {
    for (const [key, value] of Object.entries(this.infoMap)) {
      if (value.keywords.includes(keyword)) {
        return key
      }
    }
    return null
  },
  /**
   * 获取指定表情包的关键字
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {Array<string>|null} - 返回表情包关键字数组或 null
   */
  getKeywords (memeKey) {
    const memeKeywords = this.infoMap[memeKey].keywords
    return memeKeywords
  },

  /**
   * 获取所有的关键词
   * @returns {Array<string>} - 返回包含所有关键词的数组
   */
  getAllKeywords () {
    const keywords = Object.values(this.infoMap)
      .flatMap(info => info.keywords || [])
    return Array.from(new Set(keywords))
  },

  /**
     * 获取所有的 key
     * @returns {Array<string>} - 返回所有的表情包 key 的数组
     */
  getAllKeys () {
    return Object.keys(this.infoMap)
  },

  /**
   * 获取表情包的参数类型
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {object|null} - 返回参数类型信息或 null
   */
  getParams (memeKey) {
    const memeInfo = this.getInfo(memeKey)
    const { min_texts, max_texts, min_images, max_images, default_texts, args_type } = memeInfo.params_type
    return {
      min_texts,
      max_texts,
      min_images,
      max_images,
      default_texts,
      args_type
    }
  },
  /**
 * 获取指定表情包参数的类型
 * @param {string} key - 表情包的唯一标识符
 * @param {string} paramName - 参数名称
 * @returns {string|null} - 返回参数的类型或 null
 */
  getParamType (key, paramName) {
    const params = this.getParams(key)
    const argsModel = params.args_type.args_model
    const properties = argsModel.properties

    if (properties[paramName]) {
      const paramInfo = properties[paramName]
      if (paramName === 'user_infos') {
        return null
      }

      if (paramInfo.type) {
        return paramInfo.type
      }
    }

    return null
  },

  /**
   * 获取指定 key 的描述信息
   * @param {string} key - 需要获取描述的 key。
   * @returns {string} - 返回描述信息，格式为 "[参数描述1][参数描述2]..."。
   */
  descriptions (key) {
    const { args_type } = this.getParams(key)
    if (args_type == null) {
      return ''
    }
    const properties = args_type.args_model.properties || {}

    const descriptions = Object.entries(properties)
      .filter(([paramName]) => paramName !== 'user_infos')
      .map(([paramName, paramInfo]) => {
        const description = paramInfo.description || paramInfo.title || ''
        if (description) {
          return `[${paramName}: ${description}]`
        }
        return null
      })
      .filter((text) => text !== null)

    return descriptions.join('')
  },
  /**
   * 获取对应表情的表情
   * @param {string} key
   * @returns 返回对应表情, 格式为[标签1][标签2]
   */
  getTags (key) {
    const info = this.getInfo(key)
    return info.tags.map(tag => `[${tag}]`).join('')
  },

  /**
   * 获取对应表情的默认文本
   */
  getDeftext (key) {
    const info = this.getInfo(key)
    return info.params_type.default_texts
  },

  /**
   * 检查输入是否在禁用表情包列表中
   * @param {string} input - 输入的关键字或表情包键
   * @returns {Promise<boolean>} - 如果在禁用列表中返回 true，否则返回 false
   */
  async isBlacklisted (input) {
    const blacklistedKeys = await Promise.all(
      Config.access.blackList.map(async (item) => {
        return await this.getKey(item) || item
      })
    )

    if (blacklistedKeys.includes(input)) {
      return true
    }

    const memeKey = await this.getKey(input)
    return blacklistedKeys.includes(memeKey)
  },

  /**
   * 检查表情包是否在受保护的列表中
   * @param {string} memeKey - 表情包的唯一标识符
   * @param {Array<string>} protectList - 受保护的表情包列表
   * @returns {Promise<boolean>} - 如果在保护列表中返回 true，否则返回 false
   */
  async isProtected (memeKey, protectList) {
    if (protectList.includes(memeKey)) {
      return true
    }
    for (const keyword of protectList) {
      const key = this.getKey(keyword)
      if (key === memeKey) {
        return true
      }
    }
    return false
  }
}

export default Tools
