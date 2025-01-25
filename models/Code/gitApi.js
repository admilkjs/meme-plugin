import { Utils } from '#models'

const gitApi = {
  async getGitApi () {
    const isAbroad = await Utils.Tools.isAbroad()
    return isAbroad ? 'https://api.github.com' : 'https://gh.wuliya.xin/https://api.github.com'
  }
}

export default gitApi
