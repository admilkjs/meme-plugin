import { Config, Version } from '#components'
import axios from 'axios'
import FormData from 'form-data'
import axiosRetry from 'axios-retry'

/**
 * 配置 Axios 重试机制
 */
axiosRetry(axios, {
  retries: Config.meme.retry,
  retryDelay: () => 0,
  retryCondition: (error) => {
    return error.response && error.response.status === 500
  }
})

const Request = {
  /**
   * 通用请求方法
   * @param {string} url - 请求的 URL
   * @param {string} method - HTTP 方法 ('GET', 'POST', 'HEAD' 等)
   * @param {object} params - 请求参数，GET/HEAD 为 query 参数，POST 为 body 参数
   * @param {string} responseType - 响应类型（可选），如 'json', 'arraybuffer', 'blob' 等
   * @returns {Promise<any>} - 返回 Promise，解析为响应数据
   * @throws {Error} - 抛出网络错误或服务端错误
   */
  async request (url, method = 'GET', params = {}, responseType = null) {
    try {
      const options = {
        method: method.toUpperCase(),
        url,
        headers: {
          'User-Agent': Version.Plugin_Name
        },
        timeout: Config.meme.timeout * 1000,
        proxy: false
      }

      if (method.toUpperCase() === 'GET' || method.toUpperCase() === 'HEAD') {
        options.params = params
      } else if (method.toUpperCase() === 'POST') {
        options.data = params
        if (params instanceof FormData) {
          options.headers = {
            ...options.headers,
            ...params.getHeaders()
          }
        }
      }

      if (responseType) {
        options.responseType = responseType
      }

      const response = await axios(options)

      return responseType === 'arraybuffer' ? Buffer.from(response.data) : response.data

    } catch (error) {
      logger.error(error.message)
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.data
        }
      } else {
        throw {
          status: 500,
          message: '网络错误'
        }
      }
    }
  },

  /**
   * GET 请求方法
   */
  async get (url, params = {}, responseType = null) {
    return await this.request(url, 'GET', params, responseType)
  },

  /**
   * POST 请求方法
   */
  async post (url, params = {}, responseType = null) {
    return await this.request(url, 'POST', params, responseType)
  },

  /**
   * HEAD 请求方法
   */
  async head (url, params = {}) {
    return await this.request(url, 'HEAD', params)
  }
}

export default Request
