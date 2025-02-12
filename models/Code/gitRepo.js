import { exec } from 'child_process'
import util from 'node:util'
import { Version } from '#components'

const execPromise = util.promisify(exec)


export async function getRepo () {
  const localPath = Version.Plugin_Path

  try {
    const command = `git -C "${localPath}" config --get remote.origin.url`
    const { stdout: remoteUrlRaw } = await execPromise(command, { encoding: 'utf-8' })
    const remoteUrl = remoteUrlRaw.trim()

    const match = remoteUrl.match(/(?:https?:\/\/.+?\/)?(?:https?:\/\/)?github\.com[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (!match) {
      throw new Error(`无法解析远程仓库地址: ${remoteUrl}`)
    }


    const currentBranchCommand = `git -C "${localPath}" rev-parse --abbrev-ref HEAD`
    const { stdout: currentBranchRaw } = await execPromise(currentBranchCommand, { encoding: 'utf-8' })
    const currentBranch = currentBranchRaw.trim()

    return { owner: match[1], repo: match[2], currentBranch }
  } catch (error) {
    throw new Error(`获取远程仓库地址或当前分支失败: ${error.message}`)
  }
}


