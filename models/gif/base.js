import { exec } from 'child_process'
import { Readable } from 'stream'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * 检查是否安装了 FFmpeg
 * @async
 * @function checkFFmpeg
 * @returns {Promise<boolean>} 如果已安装则返回 true，否则返回 false
 */
export async function checkFFmpeg () {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch (error) {
    return false
  }
}


/**
 * 将 Readable Stream 转换为 Buffer
 * @param {Readable} stream - 可读流
 * @returns {Promise<Buffer>} - 转换后的 Buffer
 */
export async function streamToBuffer (stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
