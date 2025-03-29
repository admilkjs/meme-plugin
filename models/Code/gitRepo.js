import util from 'node:util'

import { exec } from 'child_process'

import { Version } from '#components'
import { db } from '#models'

const execPromise = util.promisify(exec)

/**
* @typedef {object} RepoInfo
* @property {string} owner - Git 仓库的拥有者 (例如: "username")
* @property {string} repo - Git 仓库的名称 (例如: "repository")
* @property {string} branchName - 当前 Git 分支的名称 (例如: "main")
*/

/**
* 获取 Git 仓库的信息，包括拥有者、仓库名和当前分支名。
*
* @async
* @function getRepo
* @returns {Promise<RepoInfo>} 包含仓库信息的对象。
* @throws {Error} 如果无法解析仓库地址或获取当前分支失败。
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
* 获取指定分支的 SHA 值。
*
* @async
* @function getBranchSha
* @param {string} branch 分支名。
* @returns {Promise<string|null>} 分支对应的 SHA 值，如果未找到则返回 null。
*/
export async function getBranchSha (branch) {
  const results = await db.update.get(branch)
  return results ? results.sha : null
}

/**
* @typedef {object} BranchInfo
* @property {string} branch - 分支名称
* @property {string} sha - 分支对应的 SHA 值
*/

/**
* 获取所有分支的信息，包括分支名和对应的 SHA 值。
*
* @async
* @function getAllBranch
* @returns {Promise<BranchInfo[]|null>} 包含所有分支信息的数组，如果没有任何分支信息则返回 null。
*/
export async function getAllBranch () {
  const results = await db.update.getAll()
  return results.length > 0 ? results : null
}

/**
* 添加或更新分支信息。
*
* @async
* @function addBranchInfo
* @param {string} branch 分支名。
* @param {string} sha 分支对应的 SHA 值。
* @returns {Promise<void>}
*/
export async function addBranchInfo (branch, sha) {
  await db.update.add(branch, sha) || null
}
