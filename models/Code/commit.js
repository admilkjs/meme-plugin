import { exec } from 'node:child_process'
import util from 'node:util'
import { Utils } from '#models'
import { getGitApi } from './gitApi.js'
import { formatCommitTime, parseCommitMessage } from './utils.js'
import { getRepo } from './gitRepo.js'

const execPromise = util.promisify(exec)

/**
 * 获取本地仓库的最新提交信息
 *
 * @param {string} localPath - 本地仓库的路径
 * @returns {Promise<Object>} 本地仓库最新提交的详细信息
 * @throws {Error} 如果获取本地commit信息失败，则抛出错误
 */
export async function getLocalCommit (localPath) {
  try {
    const { branchName } = await getRepo()

    const localVersionCommand = `git -C "${localPath}" rev-parse HEAD`
    const localTimestampCommand = `git -C "${localPath}" log -1 --format=%ct`

    const { stdout: localVersionRaw } = await execPromise(localVersionCommand)
    const sha = localVersionRaw.trim()

    const { stdout: localTimestampRaw } = await execPromise(localTimestampCommand)
    const localTimestamp = parseInt(localTimestampRaw.trim(), 10) * 1000

    const commitTime = await formatCommitTime(localTimestamp)

    return {
      sha,
      commitTime,
      branchName
    }
  } catch (error) {
    throw new Error(`获取本地commit信息失败: ${error.message}`)
  }
}


/**
 * 获取远程仓库指定分支的最新提交信息
 *
 * @param {string} owner - 仓库的拥有者
 * @param {string} repo - 仓库名称
 * @param {string} branch - 分支名称
 * @returns {Promise<Object>} 远程仓库最新提交的详细信息
 * @throws {Error} 如果获取远程commit信息失败，则抛出错误
 */
export async function getRemoteCommit (owner, repo, branch) {
  try {
    const apiBase = await getGitApi()
    const url = `${apiBase}/repos/${owner}/${repo}/commits/${branch}`

    const response = await Utils.Request.get(url)
    const commit = response.data

    const author = {
      login: commit.author?.login || '',
      avatar_url: commit.author?.avatar_url || ''
    }

    const committer = {
      login: commit.committer?.login || '',
      avatar_url: commit.committer?.avatar_url || ''
    }

    const { title, content } = await parseCommitMessage(commit.commit.message)

    return {
      sha: commit.sha,
      author,
      committer,
      message: {
        title,
        content
      },
      commitTime: await formatCommitTime(commit.commit.committer.date),
      commitUrl: commit.html_url
    }
  } catch (error) {
    throw new Error(`获取分支 ${branch} 的最新提交记录失败: ${error.message}`)
  }
}
