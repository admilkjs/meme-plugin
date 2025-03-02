import fs from 'node:fs/promises'

import { exec } from 'child_process'
import gifFrames from 'gif-frames'
import { promisify } from 'util'

import { Version } from '#components'

import * as Utils from '../Utils/index.js'
import * as base from './base.js'

const execAsync = promisify(exec)

/**
 * 解析 GIF 并提取每一帧为 PNG Buffer 数组，同时返回帧延迟
 * @param {Buffer} image GIF 图像的 Buffer
 * @returns {Promise<{ frames: Buffer[], delays: number[] }>} 帧数据和每帧的延迟（centiseconds）
 */
export const slice = async (image) => {
  let frames = []
  let delays = []

  const gifDir = `${Version.Plugin_Path}/data/gif/`
  const gifPath = `${gifDir}/input.gif`
  const outputDir = `${gifDir}/output`
  const framePattern = `${outputDir}/frame_%04d.png`

  if (await base.checkFFmpeg()) {
    try {
      if (!(await Utils.Common.fileExistsAsync(gifDir))) {
        await fs.mkdir(gifDir)
      }

      await fs.writeFile(gifPath, image)

      if (!(await Utils.Common.fileExistsAsync(outputDir))) {
        await fs.mkdir(outputDir)
      }

      await execAsync(`ffmpeg -i ${gifPath} -vsync 0 -f image2 ${framePattern}`)

      const files = await fs.readdir(outputDir)
      frames = await Promise.all(
        files
          .filter(file => file.endsWith('.png'))
          .sort((a, b) => a.localeCompare(b))
          .map(file => fs.readFile(`${outputDir}/${file}`))
      )

      delays = new Array(frames.length).fill(10)

      await fs.rm(outputDir, { recursive: true, force: true })
      await fs.rm(gifPath, { force: true })
    } catch (error) {
      console.warn(`FFmpeg 解析失败，尝试使用 gif-frames: ${error}`)
    }
  }

  if (frames.length === 0) {
    try {
      const frameData = await gifFrames({ url: image, frames: 'all', outputType: 'png' })

      frames = await Promise.all(frameData.map(frame => base.streamToBuffer(frame.getImage())))
      delays = frameData.map(frame => frame.frameInfo?.delay || 10)
    } catch (error) {
      throw new Error(`解析 GIF 时出错，请稍后再试，错误信息: ${error}`)
    }
  }

  if (frames.length < 2) {
    throw new Error('提供的图片不是 GIF，至少需要包含两帧')
  }

  return { frames, delays }
}
