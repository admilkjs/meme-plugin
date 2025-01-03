import { exec } from 'node:child_process'
import util from 'util'
import gitRepo from './gitRepo.js'
import commit from './commit.js'

const execPromise = util.promisify(exec)

const check = {
  async version (localPath) {
    try {
      const { owner, repo, currentBranch } = await gitRepo.getRepo()
      const localVersionCommand = `git -C "${localPath}" rev-parse HEAD`
      const { stdout: localVersionRaw } = await execPromise(localVersionCommand)
      const localVersion = localVersionRaw.trim()

      const latestCommit = await commit.getLatestCommit(owner, repo, currentBranch)
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
}

export default check
