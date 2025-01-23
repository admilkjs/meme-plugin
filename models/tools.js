import fs from 'node:fs/promises'
import { Data, Version, Config } from '../components/index.js'
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
    const url = 'https://ipinfo.io/json'

    try {
      const response = await Request.get(url, {}, 'json')
      if (response && response.country) {
        return response.country !== 'CN'
      } else {
        throw {
          status: 500,
          message: '获取IP所在地区失败: 返回数据不完整'
        }
      }
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
    if (this.baseUrl) {
      return this.baseUrl
    }

    if (Config.meme.url) {
      this.baseUrl = Config.meme.url.replace(/\/+$/, '')
      return this.baseUrl
    }

    this.baseUrl = 'https://meme.wuliya.cn'
    return this.baseUrl
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

    try {
      if (!Config.meme.url) {
        if (!(await this.fileExistsAsync('data/meme.json'))) {
          await this.downloadMemeData()
        }
        this.infoMap = Data.readJSON('data/meme.json')
      } else {
        if (!(await this.fileExistsAsync('data/custom/meme.json'))) {
          await this.generateMemeData()
        }
        this.infoMap = Data.readJSON('data/custom/meme.json')
      }

      if (!this.infoMap || typeof this.infoMap !== 'object') {
        logger.error('加载表情包详情失败')
        return
      }

      this.loaded = true
    } catch (error) {
      logger.error(`加载表情包数据出错: ${error.message}`)
    }
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
      logger.error('表情键值不能为空')
      return null
    }

    try {
      const baseUrl = await this.getBaseUrl()
      return `${baseUrl}/memes/${memeKey}/preview`
    } catch (error) {
      throw error
    }
  },

  /**
   * 下载远程表情包数据
   * @param {boolean} forceUpdate - 是否强制更新数据
   * @returns {Promise<void>}
   */
  async downloadMemeData (forceUpdate = false) {
    try {
      const filePath = `${Version.Plugin_Path}/data/meme.json`
      Data.createDir('data')
      if (await this.fileExistsAsync(filePath) && !forceUpdate) {
        return
      }
      if (forceUpdate && await this.fileExistsAsync(filePath)) {
        await fs.unlink(filePath)
      }
      const response = await Request.get('https://pan.wuliya.cn/d/Yunzai-Bot/data/meme.json')
      Data.writeJSON('data/meme.json', response)
    } catch (error) {
      logger.error(`下载远程表情包数据失败: ${error.message}`)
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
      const filePath = `${Version.Plugin_Path}/data/custom/meme.json`
      Data.createDir('data/custom', '', false)
      if (await this.fileExistsAsync(filePath) && !forceUpdate) {
        return
      }
      if (forceUpdate && await this.fileExistsAsync(filePath)) {
        await fs.unlink(filePath)
      }

      const baseUrl = await this.getBaseUrl()
      if (!baseUrl) {
        throw new Error('无法获取基础URL')
      }
      const keysResponse = await Request.get(`${baseUrl}/memes/keys`)
      const memeData = {}

      for (const key of keysResponse) {
        const infoResponse = await Request.get(`${baseUrl}/memes/${key}/info`)
        memeData[key] = infoResponse
      }

      Data.writeJSON('data/custom/meme.json', memeData, 2)
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
   * 获取表情包的参数类型
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {object|null} - 返回参数类型信息或 null
   */
  getParams (memeKey) {
    const memeInfo = this.getInfo(memeKey)
    if (!memeInfo || !memeInfo.params_type) {
      return null
    }
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
   * 获取指定 key 的描述信息，优先使用自定义描述，否则使用默认描述。
   * @param {string} key - 需要获取描述的 key。
   * @returns {string} - 返回描述信息，格式为 "[描述1][描述2]..."。
   */
  descriptions (key) {
    if (Config.custom.descriptions) {
      const custom = Config.custom.descriptions.find(
        (item) => item.key === key
      )
      if (custom) {
        return custom.desc.map(desc => `[${desc}]`).join('')
      }
    }

    const info = this.getInfo(key)
    const parserOptions = info.params_type.args_type.parser_options || []
    const helpTexts = parserOptions
      .map((option) => option.help_text)
      .filter((text) => text)
    return `[${helpTexts.join('][')}]`
  },



  /**
   * 获取指定表情包的关键字
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {Array<string>|null} - 返回表情包关键字数组或 null
   */
  getKeywords (memeKey) {
    const memeInfo = this.infoMap?.[memeKey]
    return memeInfo?.keywords || null
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
