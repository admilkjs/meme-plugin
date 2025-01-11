import Args from '../args.js'

export async function handleArgs (memeKey, userText, argsType, formData) {
  if (argsType !== null) {
    const argsMatches = userText.match(/#([^#]+)/g)
    if (argsMatches) {
      const argsArray = argsMatches.map(arg => arg.slice(1).trim())
      const argsString = Args.handle(memeKey, argsArray)
      formData.append('args', argsString)
    }

    userText = userText.replace(/#([^#]+)/g, '').trim()
  } else {
    const argsString = Args.handle(memeKey)
    formData.append('args', argsString)
  }
}
