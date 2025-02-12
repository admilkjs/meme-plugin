import { exec } from 'node:child_process'
import util from 'node:util'
import { getRepo } from './gitRepo.js'
import { getLatestCommit } from './commit.js'

const execPromise = util.promisify(exec)

export async function getLocalCommit (localPath) {
  try {
    const { owner, repo, currentBranch } = await getRepo()
    const localVersionCommand = `git -C "${localPath}" rev-parse HEAD`
    const { stdout: localVersionRaw } = await execPromise(localVersionCommand)
    const localVersion = localVersionRaw.trim()

    const latestCommit = await getLatestCommit(owner, repo, currentBranch)
    const isUpToDate = localVersion === latestCommit.sha

    return {
      isUpToDate,
      localVersion,
      branchVersion: latestCommit.sha,
      branchName: currentBranch,
      latestCommit
    }
  } catch (error) {
    throw new Error(`版本检测失败: ${error.message}`)
  }
}


