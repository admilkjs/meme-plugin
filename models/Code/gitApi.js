import { Utils } from '#models'

/**
 * 获取GitHub API的基础URL，根据是否在国外的情况决定返回不同的API地址。
 *
 * @async
 * @function getGitApi
 * @returns {Promise<string>} 返回GitHub API的基础URL，国外返回`https://api.github.com`，国内返回`https://gh.wuliya.xin/https://api.github.com`
 * @throws {Error} 如果判断是否在国外时发生错误，将抛出异常
 */
export async function getGitApi () {
  const isAbroad = await Utils.Common.isAbroad()
  return isAbroad ? 'https://api.github.com' : 'https://gh.wuliya.xin/https://api.github.com'
}
