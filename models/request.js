import { Config, Version } from '#components'
import axios from 'axios'
import FormData from 'form-data'
import axiosRetry from 'axios-retry'

/**
 * 重试机制配置
 */
axiosRetry(axios, {
  retries: Config.meme.retry,
  retryDelay: () => 1000,
  retryCondition: (error) => {
    return error.response && error.response.status === 500
  }
})

const Request = {
  /**
   * 通用请求方法
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
          message: JSON.parse(error.response.data.toString())
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
   * GET 请求
   */
  async get (url, params = {}, responseType = null) {
    return await this.request(url, 'GET', params, responseType)
  },

  /**
   * POST 请求
   */
  async post (url, params = {}, responseType = null) {
    return await this.request(url, 'POST', params, responseType)
  },

  /**
   * HEAD 请求
   */
  async head (url, params = {}) {
    return await this.request(url, 'HEAD', params)
  }
}

export default Request
