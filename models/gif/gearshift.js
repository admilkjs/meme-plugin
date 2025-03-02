import { createCanvas, loadImage } from '@napi-rs/canvas'
import { BitmapImage, GifCodec, GifFrame } from 'gifwrap'

import { Utils } from '#models'

import { slice } from './silce.js'

/**
 * 调整 GIF 速度
 * @param {Buffer}image GIF Buffer
 * @param {number}speed 速度倍率，必须大于 0
 * @returns {Promise<Buffer>}处理后的 GIF Buffer
 */
export async function gearshift (image, speed) {
  if (speed <= 0) {
    throw new Error('速度倍数必须大于 0')
  }

  const { frames, delays } = await slice(image)

  if (frames.length < 2) {
    throw new Error('提供的图片不是 GIF，至少需要包含两帧')
  }

  const codec = new GifCodec()
  const width = 300
  const height = 300

  const gifFrames = await Promise.all(
    frames.map(async (frameBuffer, index) => {
      const image = await loadImage(frameBuffer)
      const canvas = createCanvas(width, height)
      const ctx = canvas.getContext('2d')

      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(image, 0, 0, width, height)

      const imageData = ctx.getImageData(0, 0, width, height)
      const buffer = Buffer.from(imageData.data)

      for (let i = 0; i < buffer.length; i += 4) {
        if (buffer[i + 3] === 0) {
          buffer[i] = 255
          buffer[i + 1] = 255
          buffer[i + 2] = 255
        }
      }

      const bitmap = new BitmapImage(width, height, buffer)
      const adjustedDelay = Math.max(1, Math.round(delays[index] / speed))

      return new GifFrame(bitmap, { delayCentisecs: adjustedDelay })
    })
  )

  const encodedGif = await codec.encodeGif(gifFrames, { loops: 0 })
  return await Utils.Common.getImageBuffer(encodedGif.buffer)
}
