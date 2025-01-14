import _ from 'lodash'

async function handleArgs (memeKey, userText, formData) {
  const argsMatches = userText.match(/#([^#]+)/g)
  if (argsMatches) {
    const argsArray = argsMatches.map(arg => arg.slice(1).trim())
    const argsString = await handle(memeKey, argsArray)
    formData.append('args', argsString)
  }

  return userText.replace(/#([^#]+)/g, '').trim()
}

async function descriptions (key) {
  const descriptionMap = {
    look_flat: '看扁率，数字.如#3',
    crawl: '爬的图片编号, 1-92。如#33',
    firefly_holdsign: '流萤举牌的图片编号，1-21。如#2',
    symmetric: '方向，上下左右。如#下',
    dog_dislike: '是否圆形头像，输入圆即可。如#圆',
    petpet: '是否圆形头像，输入圆即可。如#圆',
    jiji_king: '是否圆形头像，输入圆即可。如#圆',
    kirby_hammer: '是否圆形头像，输入圆即可。如#圆',
    always: '一直图像的渲染模式，循环、套娃、默认。不填参数即默认。如一直#循环',
    gun: '方向，左、右、两边。如#两边',
    bubble_tea: '方向，左、右、两边。如#两边',
    clown: '是否使用爷爷头轮廓。如#爷',
    note_for_leave: '请假时间。如#2023年11月11日',
    mourning: '是否黑白。如#黑白 或 #灰',
    genshin_eat: '吃的角色(八重、胡桃、妮露、可莉、刻晴、钟离)。如#胡桃',
    clown_mask: '小丑在前或在后，如#前 #后',
    alipay: '二维码的内容链接或文本，如#https://github.com',
    wechat_pay: '二维码的内容链接或文本，如#https://github.com',
    panda_dragon_figure: '奇怪龙表情生成，如#原神龙',
    jinhsi: '病娇的图片编号, 1-13。如#10',
    sick_delicate: '今汐的图片编号, 1-4。如#1',
    kokona_say: '消息框的位置，如#左',
    pjsk: '角色名称(爱莉, 彰人, 杏, 梦, 绘名, 遥, 穗波, 一歌, KAITO, 奏, 心羽, 连, 流歌, 真冬, MEIKO, 初音未来, 实乃理, 瑞希, 宁宁, 铃, 类, 咲希, 志步, 雫, 冬弥, 司)，以及指定图片。如#爱莉#3',
    keep_your_money: '角色名称(阿罗娜, 普拉娜)',
    police_warn: '警告的牌子的名称，如#警惕小南梁'
  }

  return descriptionMap[key]
}

async function handle (key, args) {
  if (!args) {
    args = ''
  }
  let argsObj = {}
  switch (key) {
    case 'look_flat': {
      argsObj = { ratio: parseInt(args[0] || '2') }
      break
    }
    case 'crawl': {
      argsObj = { number: parseInt(args[0]) ? parseInt(args[0]) : _.random(1, 92, false) }
      break
    }
    case 'firefly_holdsign': {
      argsObj = { number: parseInt(args[0]) ? parseInt(args[0]) : _.random(1, 21, false) }
      break
    }
    case 'symmetric': {
      let directionMap = {
        左: 'left',
        右: 'right',
        上: 'top',
        下: 'bottom'
      }
      argsObj = { direction: directionMap[args[0]] || 'left' }
      break
    }
    case 'petpet':
    case 'jiji_king':
    case 'kirby_hammer': {
      argsObj = { circle: args[0].startsWith('圆') }
      break
    }
    case 'my_friend': {
      argsObj = { name: args[0] }
      break
    }
    case 'looklook': {
      argsObj = { mirror: args[0] === '翻转' }
      break
    }
    case 'always': {
      let modeMap = {
        '': 'normal',
        循环: 'loop',
        套娃: 'circle'
      }
      argsObj = { mode: modeMap[args[0]] || 'normal' }
      break
    }
    case 'gun':
    case 'bubble_tea': {
      let directionMap = {
        左: 'left',
        右: 'right',
        两边: 'both'
      }
      argsObj = { position: directionMap[args[0]] || 'right' }
      break
    }
    case 'dog_dislike': {
      argsObj = { circle: args[0].startsWith('圆') }
      break
    }
    case 'clown': {
      argsObj = { person: args[0].startsWith('爷') }
      break
    }
    case 'note_for_leave': {
      if (args) {
        argsObj = { time: args[0] }
      }
      break
    }
    case 'mourning': {
      argsObj = { black: args[0].startsWith('黑白') || args.startsWith('灰') }
      break
    }
    case 'genshin_eat': {
      const roleMap = {
        八重: 1,
        胡桃: 2,
        妮露: 3,
        可莉: 4,
        刻晴: 5,
        钟离: 6
      }
      argsObj = { character: roleMap[args[0]] || 0 }
      break
    }
    case 'clown_mask': {
      argsObj = { mode: args[0] === '前' ? 'front' : 'behind' }
      break
    }
    case 'alipay': {
      argsObj = {
        message: args[0] || ''
      }
      break
    }
    case 'wechat_pay': {
      argsObj = {
        message: args[0] || ''
      }
      break
    }
    case 'panda_dragon_figure': {
      argsObj = {
        name: args[0] || ''
      }
      break
    }
    case 'jinhsi': {
      argsObj = { number: Math.min(parseInt(args[0] || '1'), 13) }
      break
    }
    case 'sick_delicate': {
      argsObj = { number: Math.min(parseInt(args[0] || '1'), 4) }
      break
    }
    case 'kokona_say': {
      let positionMap = {
        左: 'left',
        右: 'right',
        随机: 'random'
      }
      argsObj = { position: positionMap[args[0]] || 'random' }
      break
    }
    case 'pjsk': {
      let roleMap = {
        爱莉: 1,
        彰人: 2,
        杏: 3,
        梦: 4,
        绘名: 5,
        遥: 6,
        穗波: 7,
        一歌: 8,
        KAITO: 9,
        奏: 10,
        心羽: 11,
        连: 12,
        流歌: 13,
        真冬: 14,
        MEIKO: 15,
        初音未来: 16,
        实乃理: 17,
        瑞希: 18,
        宁宁: 19,
        铃: 20,
        类: 21,
        咲希: 22,
        志步: 23,
        雫: 24,
        冬弥: 25,
        司: 26
      }
      argsObj = {
        character: roleMap[args[0]] || 0,
        number: parseInt(args[1] || '0')
      }
      break
    }
    case 'keep_your_money': {
      let roleMap = {
        阿罗娜: 1,
        普拉娜: 2
      }
      argsObj = { number: roleMap[args[0]] || 0 }
      break
    }
    case 'police_warn': {
      argsObj = {
        name: args[0] || ''
      }
      break
    }
  }
  return JSON.stringify(argsObj)
}

export { handleArgs, handle , descriptions }
