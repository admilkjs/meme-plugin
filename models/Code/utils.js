export async function formatCommitTime (commitDate) {
  return new Date(commitDate).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false
  })
}

export async function parseCommitMessage (message) {
  const [title, ...contentLines] = message.split('\n\n')
  const content = contentLines.join('\n\n')
  return { title: title || '', content: content || '' }
}
