import chalk from 'chalk'

import { Config } from '#components'
import { db, Utils } from '#models'


const Tools = {
  /**
   * 获取表情包请求的基础 URL
   * @returns {Promise<string>} - 返回表情包基础 URL
   */
  async getBaseUrl () {
    /** 该方法后续会扩展，为rust准备 */
    return Config.server?.url?.replace(/\/+$/, '') || 'https://meme.wuliya.cn'
  },

  /**
   * 加载表情包数据
   * 如果数据已加载则直接返回，否则从本地或远程加载表情包数据
   * @returns {Promise<void>}
   */
  async init () {
    logger.debug(chalk.cyan('🚀 开始加载表情包数据...'))

    const memeData = await db.meme.getAll()

    if (!memeData || memeData.length === 0) {
      logger.debug(chalk.cyan('🚀 表情包数据不存在，开始生成...'))
      await this.generateMemeData(true)
    } else {
      logger.debug(chalk.cyan('✅ 表情包数据已存在，加载完成'))
    }
  },


  /**
   * 生成本地表情包数据
   * @param {boolean} forceUpdate - 是否进行全量更新数据, 默认为增量更新数据
   * @returns {Promise<void>}
   */
  async generateMemeData (forceUpdate = false) {
    try {
      const baseUrl = await this.getBaseUrl()
      if (!baseUrl) {
        logger.error('❌ 无法获取表情包请求基础路径')
        return
      }

      logger.info(chalk.magenta.bold('🌟 开始生成表情包数据...'))

      const localKeys = forceUpdate ? new Set() : new Set(await this.getAllKeys())

      const remoteKeysResponse = await Utils.Request.get(`${baseUrl}/memes/keys`)
      if (!remoteKeysResponse.success || !remoteKeysResponse.data.length) {
        logger.warn('⚠️ 未获取到任何表情包键值，跳过数据更新。')
        return
      }
      const remoteKeys = new Set(remoteKeysResponse.data)

      const keysToUpdate = forceUpdate
        ? [...remoteKeys]
        : [...remoteKeys].filter(key => !localKeys.has(key))

      const keysToDelete = [...localKeys].filter(key => !remoteKeys.has(key))

      if (!keysToUpdate.length && !keysToDelete.length) {
        logger.info(chalk.cyan('✅ 表情包数据已是最新，无需更新或删除。'))
        return
      }

      logger.debug(chalk.magenta(`🔄 需要更新 ${keysToUpdate.length} 个表情包`))
      logger.debug(chalk.red(`🗑️  需要删除 ${keysToDelete.length} 个表情包`))

      if (keysToDelete.length) {
        await this.removeKey(keysToDelete)
        logger.info(chalk.yellow(`🗑️ 已删除 ${keysToDelete.length} 个表情包`))
      }

      await Promise.all(
        keysToUpdate.map(async key => {
          const infoResponse = await Utils.Request.get(`${baseUrl}/memes/${key}/info`)
          if (!infoResponse.success) {
            logger.error(`❌ 获取表情包详情失败: ${key} - ${infoResponse.message}`)
            return
          }

          const info = infoResponse.data
          const {
            keywords: keyWords = null,
            shortcuts = null,
            tags = null,
            params_type: params = null
          } = info

          const min_texts = params?.min_texts ?? null
          const max_texts = params?.max_texts ?? null
          const min_images = params?.min_images ?? null
          const max_images = params?.max_images ?? null
          const defText = params?.default_texts?.length ? params.default_texts : null
          const args_type = params?.args_type ?? null

          await db.meme.add(
            key,
            info,
            keyWords,
            params,
            min_texts,
            max_texts,
            min_images,
            max_images,
            defText,
            args_type,
            shortcuts,
            tags,
            { force: true }
          )
        })
      )

      logger.info(chalk.green.bold('✅ 表情包数据更新完成！'))
    } catch (error) {
      logger.error(`❌ 生成本地表情包数据失败: ${error.message}`)
      throw error
    }
  },

  /**
 * 发送表情包生成请求
 */
  async request (endpoint, params = {}, responseType = 'arraybuffer') {
    const baseUrl = await this.getBaseUrl()
    const url = `${baseUrl}/memes/${endpoint}/`

    const isFormData = params instanceof FormData
    const headers = responseType ? { Accept: responseType } : {}

    return Utils.Request.post(url, params, isFormData ? undefined : headers, responseType)
  },

  /**
   * 获取表情包的预览图片地址
   * @param {string} memeKey - 表情包的唯一标识符
   * @returns {Promise<string|null>} - 返回预览图片的 URL 或 null
   */
  async getPreviewUrl (memeKey) {
    return memeKey ? `${await this.getBaseUrl()}/memes/${memeKey}/preview` : null
  },


  /** 下面的部分待重写 */
  /**
   * 获取所有表情包的信息
   * @returns {object|null} - 返回表情包信息映射表
   */
  //   getInfoMap () {
  //     if (!this.inited) return
  //     return this.infoMap || null
  //   },

  //   /**
  //    * 获取指定表情包的信息
  //    * @param {string} memeKey - 表情包的唯一标识符
  //    * @returns {object|null} - 返回表情包的信息或 null
  //    */
  //   getInfo (memeKey) {
  //     if (!this.inited) return
  //     return this.infoMap[memeKey] || null
  //   },

  /**
     * 将关键字转换为表情包键
     * @param {string} keyword - 表情包关键字
     * @returns {string|null} - 返回对应的表情包键或 null
     */
  async getKey (keyword) {
    return (await db.meme.getByField('keyWords', keyword)).toString() || null
  },
  /**
     * 获取指定表情包的关键字
     * @param {string} memeKey - 表情包的唯一标识符
     * @returns {string[]|null} - 返回表情包关键字数组或 null
     */
  async getKeyWords (memeKey) {
    return JSON.parse(await db.meme.getByKey(memeKey, 'keyWords')) || null
  },


  /**
 * 获取所有的关键词
 * @returns {Promise<Array<string>>} - 返回包含所有关键词的数组
 */
  async getAllKeyWords () {
    const keyWordsList = await db.meme.getAllSelect('keyWords')

    return keyWordsList.map(item => JSON.parse(item)).flat() || null
  },


  /**
       * 获取所有的 key
       * @returns {Array<string>} - 返回所有的表情包 key 的数组
       */
  async getAllKeys () {
    const keyList = await db.meme.getAllSelect('key')

    return keyList.flat() || null
  },

  /**
 * 获取表情包的参数类型
 * @param {string} memeKey - 表情包的键值
 * @returns {Promise<object|null>} - 返回参数类型信息或 null
 */
  async getParams (memeKey) {
    if (!memeKey) return null

    const memeParams = await db.meme.getByKey(memeKey, 'params')

    if (!memeParams) {
      return null
    }

    const { min_texts, max_texts, min_images, max_images, default_texts, args_type } = JSON.parse(memeParams)

    return { min_texts, max_texts, min_images, max_images, default_texts, args_type } || null
  },
  /**
   * 获取指定表情包参数的类型
   * @param {string} key - 表情包的唯一标识符
   * @param {string} paramName - 参数名称
   * @returns {string|null} - 返回参数的类型或 null
   */
  async getParamType (key, paramName) {
    const params = await this.getParams(key)
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
     * 获取指定 key 的参数描述信息
     * @param {string} key - 需要获取描述的 key。
     * @returns {object|null} - 返回描述信息
     */
  async getDescriptions (key) {
    const args_type = JSON.parse(await db.meme.getByKey(key, 'args_type'))
    if (args_type === null) {
      return null
    }

    const properties = args_type.args_model?.properties || null

    const descriptions = Object.entries(properties)
      .filter(([paramName]) => paramName !== 'user_infos')
      .reduce((acc, [paramName, paramInfo]) => {
        acc[paramName] = paramInfo.description || paramInfo.title || null
        return acc
      }, {})

    return descriptions
  },

  /**
     * 获取对应表情的表情
     * @param {string} key
     * @returns {string[]|null} 返回对应表情的表情
     */
  async getTags (key) {
    return JSON.parse(await db.meme.getByKey(key, 'tags')) || null
  },

  /**
     * 获取对应表情的默认文本
     * @param {string} key
     * @returns {string[]|null} 返回对应表情的默认文本
     */
  async getDeftext (key) {
    return JSON.parse(await db.meme.getByKey(key, 'defText')) || null
  },

  /**
   * 删除指定key的表情
   * @param {string||string[]} key
   * @returns {boolean}
   */
  async removeKey (keys) {
    if (!Array.isArray(keys)) {
      keys = [keys] // 确保 keys 是数组
    }
    await Promise.all(keys.map(key => db.meme.remove(key)))
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
  }
}

export { Tools }
