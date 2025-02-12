import { Utils } from '#models'

export async function getGitApi () {
  const isAbroad = await Utils.Tools.isAbroad()
  return isAbroad ? 'https://api.github.com' : 'https://gh.wuliya.xin/https://api.github.com'
}

