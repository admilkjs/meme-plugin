import { exec } from 'child_process'
import util from 'node:util'
import { Version } from '#components'
import { db } from '#models'

const execPromise = util.promisify(exec)

/**
 * 获取Git仓库的信息
 * @returns {Promise<{owner: string, repo: string, currentBranch: string}>}
 */
export async function getRepo () {
  const localPath = Version.Plugin_Path

  try {
    const command = `git -C "${localPath}" config --get remote.origin.url`
    const { stdout: remoteUrlRaw } = await execPromise(command, { encoding: 'utf-8' })
    const remoteUrl = remoteUrlRaw.trim()

    const match = remoteUrl.match(/(?:https?:\/\/.+?\/)?(?:https?:\/\/)?github\.com[:\/]([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (!match) {
      throw new Error(`无法解析仓库地址: ${remoteUrl}`)
    }


    const currentBranchCommand = `git -C "${localPath}" rev-parse --abbrev-ref HEAD`
    const { stdout: currentBranchRaw } = await execPromise(currentBranchCommand, { encoding: 'utf-8' })
    const branchName = currentBranchRaw.trim()

    return { owner: match[1], repo: match[2], branchName }
  } catch (error) {
    throw new Error(`获取仓库地址或当前分支失败: ${error.message}`)
  }
}

/**
 * 获取对应分支的sha值
 * @param {string} branch 分支名
 * @returns {Promise<string|null>}
 */
export async function getBranchSha (branch) {
  const results = await db.update.get(branch)
  return results ? results.sha : null
}

/**
 * 获取所有分支信息
 * @returns {Promise<{branch: string, sha: string}[]>}
 */
export async function getAllBranch (){
  const results = await db.update.getAll()
  return results.length > 0 ? results : null
}

export async function addBranchInfo (branch, sha) {
  await db.update.add(branch, sha) || null
}

