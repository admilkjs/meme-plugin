/**
* 格式化提交时间为本地时间字符串。
*
* @async
* @function formatCommitTime
* @param {string | number | Date} commitDate - 提交时间，可以是字符串、数字或 Date 对象。
* @returns {Promise<string>} 格式化后的本地时间字符串 (例如: "2024/02/15 10:30:00")。
*/
export async function formatCommitTime (commitDate) {
  return new Date(commitDate).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false
  })
}

/**
 * 解析提交消息，将其拆分为标题和内容。
 *
 * @async
 * @function parseCommitMessage
 * @param {string} message - 完整的提交消息。
 * @returns {Promise<{title: string, content: string}>} 包含标题和内容的对象。
 *   @property {string} title - 提交消息的标题。
 *   @property {string} content - 提交消息的内容。
 */
export async function parseCommitMessage (message) {
  const [title, ...contentLines] = message.split('\n\n')
  const content = contentLines.join('\n\n')
  return { title: title || '', content: content || '' }
}
