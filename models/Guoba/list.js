import Tools from '../Utils/tools.js'

export default async function list () {
  await Tools.load()

  return Array.from(new Set(
    Object.values(Tools.getInfoMap() || {}).flatMap(info => info.keywords)
  )).map(keyword => ({ label: keyword, value: keyword }))
}
