import { Data, Config } from '../components/index.js'
import Tools from './tools.js'
import Request from './request.js'

const Meme = {
  infoMap: null,
  loaded: false,
  baseUrl: null,

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
      const isAbroad = await Tools.isAbroad()
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
        if (!(await Tools.fileExistsAsync('data/meme.json'))) {
          await Tools.downloadMemeData()
        }
        this.infoMap = Data.readJSON('data/meme.json')
      } else {
        if (!(await Tools.fileExistsAsync('data/custom/meme.json'))) {
          await Tools.generateMemeData()
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
  }
}

export default Meme
