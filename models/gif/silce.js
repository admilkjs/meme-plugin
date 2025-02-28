import fs from 'node:fs/promises'

import { exec } from 'child_process'
import gifFrames from 'gif-frames'
import { promisify } from 'util'

import { Version } from '#components'

import * as Utils from '../Utils/index.js'
import * as base from './base.js'

const execAsync = promisify(exec)


/**
 * 解析 GIF 并提取每一帧为 PNG Buffer 数组
 * @async
 * @param {Buffer} image GIF 图像的 Buffer
 * @returns {Promise<Buffer[]>} 每一帧对应的 PNG Buffer 数组
 * @throws {Error} 解析过程中发生错误
 */
export async function slice (image) {
  if (!(await base.checkFFmpeg())) {
    try {
      const frameData = await gifFrames({ url: image, frames: 'all', outputType: 'png' })

      const frames = await Promise.all(
        frameData.map(async (frame) => {
          return await base.streamToBuffer(frame.getImage())
        })
      )
      return frames
    } catch (error) {
      throw new Error(`解析 GIF 时出错，请稍后再试, 错误信息: ${error}`)
    }
  } else {
    const gifDir = `${Version.Plugin_Path}/data/gif/`
    if(!await Utils.Common.fileExistsAsync(gifDir)){
      await fs.mkdir(gifDir)
    }

    const gifPath = `${gifDir}/input.gif`

    try {
      await fs.writeFile(gifPath, image)

      const outputDir = `${gifDir}/output`
      if(!await Utils.Common.fileExistsAsync(outputDir)){
        await fs.mkdir(outputDir)
      }

      const framePattern = `${outputDir}/frame_%04d.png`
      await execAsync(`ffmpeg -i ${gifPath} -vsync 0 -f image2 ${framePattern}`)

      const files = await fs.readdir(outputDir)
      const frameBuffers = await Promise.all(
        files
          .filter((file) => file.endsWith('.png'))
          .sort((a, b) => a.localeCompare(b))
          .map(async (file) => fs.readFile(`${outputDir}/${file}`))
      )

      await fs.rm(outputDir, { recursive: true, force: true })
      await fs.rm(gifPath, { force: true })

      return frameBuffers
    } catch (error) {
      throw new Error(`使用 FFmpeg 解析 GIF 时出错: ${error}`)
    }
  }
}
