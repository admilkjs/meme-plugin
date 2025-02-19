import { Config } from '#components'
import { dailyNoteByWidget } from '../../earth-k-plugin/apps/emoticon.js'

if (Config.other.hijackRes) {
  dailyNoteByWidget.prototype.accept = async function () {
    logger.info('[清语表情:表情包] 已劫持土块插件表情包')
  }
}