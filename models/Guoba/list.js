import { Tools } from '../Utils/index.js'

export default async function list () {
  await Tools.load()

  return Array.from(new Set(
    Object.values(Tools.getInfoMap() || {}).flatMap(info => info.keywords)
  )).map(keyword => ({ label: keyword, value: keyword }))
}
