import fs from 'fs/promises'
import { Data, Version, Config } from '../components/index.js'
import Request from './request.js'

const Tools = {
  infoMap: null,
  loaded: false,
  baseUrl: null,

  /**
   * 检查指定文件是否存在
   */
  async fileExistsAsync (filePath) {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  },

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
      logger.error(`获取IP所在地区错误: ${error.message}`)
      return false
    }
  },

  /**
   * 获取表情包请求地址
   * @returns {string}
   */
  async getBaseUrl () {
    if (this.baseUrl) {
      return this.baseUrl
    }

    if (Config.meme.url) {
      this.baseUrl = Config.meme.url.replace(/\/+$/, '')
      return this.baseUrl
    }

    let Url = 'https://meme.wuliya.cn'

    try {
      const isAbroad = await this.isAbroad()
      if (isAbroad) {
        Url = 'https://meme.wuliya.xin'
      }
    } catch (error) {
      logger.error(`获取IP地址出错，使用默认 URL: ${error.message}`)
    }

    this.baseUrl = Url
    return this.baseUrl
  },

  /**
   * 加载表情包数据
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
   * 发送表情包请求
   * @param {string} endpoint 请求地址
   * @param {object} params 请求参数
   * @param {string} method 请求方法
   * @param {string} responseType 响应类型
   * @returns {Promise<any>}
   */
  async request (endpoint, params = {}, method = 'GET', responseType = null) {
    const baseUrl = await this.getBaseUrl()
    const url = `${baseUrl}/${endpoint}`

    try {
      return await Request.request(url, method, params, responseType)
    } catch (error) {
      throw error
    }
  },

  /**
   * 获取表情包预览图片地址
   * @param {string} memeKey
   * @returns {Promise<string|null>}
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
   * 获取远程表情包数据
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
 */
  getInfoMap () {
    return this.infoMap || null
  },
  /**
   * 获取表情包信息
   */
  getInfo (memeKey) {
    return this.infoMap?.[memeKey] || null
  },

  /**
   * 将关键字转换为表情包键
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
   * 获取表情包关键字
   */
  getKeywords (memeKey) {
    const memeInfo = this.infoMap?.[memeKey]
    return memeInfo?.keywords || null
  },

  /**
   * 检查是否在禁用表情列表中
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
  }
}

export default Tools
