import _ from 'lodash'
import Tools from '../tools.js'
import Utils from '../utils.js'
async function handleArgs (e, memeKey, userText, allUsers, formData) {
  const argsMatches = userText.match(/#([^#]+)/g)
  if (argsMatches) {
    const argsArray = argsMatches.map(arg => arg.slice(1).trim())
    const argsString = await handle(e, memeKey, allUsers, argsArray)
    formData.append('args', argsString)
  }
  const Text = userText.replace(/#([^#]+)/g, '').trim()
  return Text
}

async function handle (e, key, allUsers, args) {
  if (!args) {
    args = ''
  }

  let argsObj = {}
  const paramsInfo = Tools.getParams(key)
  const { args_type } = paramsInfo
  const { parser_options } = args_type

  const argMap = {}
  for (let i = 0; i < parser_options.length; i++) {
    const option = parser_options[i]
    const argName = option.args[0].name
    if (args[i]) {
      if (option.args[0].value === 'int') {
        argMap[argName] = parseInt(args[i])
      } else {
        argMap[argName] = args[i]
      }
    }
  }
  argsObj = argMap
  const userInfos = [{
    text: await Utils.getNickname(allUsers[0]|| e.sender.user_id , e),
    gender: await Utils.getGender(allUsers[0]|| e.sender.user_id, e)
  }]

  const result = {
    user_infos: userInfos,
    ...argsObj
  }

  return JSON.stringify(result)
}


export { handleArgs, handle }


