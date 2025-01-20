import Tools from '../tools.js'

const gitApi = {
  async getGitApi () {
    const isAbroad = await Tools.isAbroad()
    return isAbroad ? 'https://api.github.com' : 'https://gh.wuliya.xin/https://api.github.com'
  }
}

export default gitApi
