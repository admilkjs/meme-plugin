import { sequelize, DataTypes } from './base.js'

/**
 * 定义 `meme` 表（包含 JSON 数据存储、关键字、参数、标签等）
 */
export const table = sequelize.define('meme', {
  /**
   * 唯一标识符
   * @type {string}
   */
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    unique: true
  },
  /**
   * 存储信息的 JSON 字段
   * @type {object}
   */
  info: {
    type: DataTypes.JSON,
    allowNull: false
  },
  /**
   * 关键字列表（JSON 数组）
   * @type {string[]}
   */
  keyWords: {
    type: DataTypes.JSON,
    allowNull: false
  },
  /**
   * 参数列表（JSON 数组）
   * @type {object}
   */
  params: {
    type: DataTypes.JSON,
    allowNull: false
  },
  /**
   * 最小文本数量
   * @type {number}
   */
  min_texts: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  /**
   * 最大文本数量
   * @type {number}
   */
  max_texts: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  /**
   * 最小图片数量
   * @type {number}
   */
  min_images: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  /**
   * 最大图片数量
   * @type {number}
   */
  max_images: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  /**
   * 默认文本（可选 JSON 数组）
   * @type {string[] | null}
   */
  defText: {
    type: DataTypes.JSON,
    allowNull: true
  },
  /**
   * 参数类型（可选 JSON 字段）
   * @type {object | null}
   */
  args_type: {
    type: DataTypes.JSON,
    allowNull: true
  },
  /**
   * 快捷方式（可选 JSON 字段）
   * @type {object | null}
   */
  shortcuts: {
    type: DataTypes.JSON,
    allowNull: true
  },
  /**
   * 标签（可选 JSON 数组）
   * @type {string[] | null}
   */
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  freezeTableName: true,
  defaultScope: {
    raw: true
  }
})

await table.sync()

/**
 * 添加或更新表情包记录
 * @param {string} key - 唯一标识符
 * @param {object} info - 存储的信息
 * @param {object} params - 参数 JSON
 * @param {number} min_texts - 最小文本数量
 * @param {number} max_texts - 最大文本数量
 * @param {number} min_images - 最小图片数量
 * @param {number} max_images - 最大图片数量
 * @param {object | null} args_type - 参数类型（可选）
 * @param {object | null} shortcuts - 快捷方式（可选）
 * @param {string[] | null} tags - 标签数组（可选）
 * @param {object} options - 选项（`force` 是否覆盖已有记录）
 * @returns {Promise<object>} - 返回创建或更新的记录
 */
export async function add (
  key,
  info,
  keyWords,
  params,
  min_texts,
  max_texts,
  min_images,
  max_images,
  defText,
  args_type,
  shortcuts,
  tags,
  { force = false }
) {
  const existingRecord = await table.findOne({
    where: { key },
    raw: false
  })

  if (force && existingRecord) {
    await table.destroy({
      where: { key }
    })
  }

  if (!force && existingRecord) {
    await existingRecord.update({
      info,
      keyWords,
      params,
      min_texts,
      max_texts,
      min_images,
      max_images,
      defText,
      args_type,
      shortcuts,
      tags
    })
    return existingRecord
  }

  return await table.create({
    key,
    info,
    keyWords,
    params,
    min_texts,
    max_texts,
    min_images,
    max_images,
    defText,
    args_type,
    shortcuts,
    tags
  })
}


/**
 * 通过 key 查询表情包数据
 * @param {string} key - 唯一标识符
 * @returns {Promise<object | null>} - 返回查询到的记录或 null
 */
export async function get (key) {
  return await table.findOne({
    where: { key }
  })
}

/**
 * 通过 key 查询指定字段的值
 * @param {string} key - 表情包的唯一标识符
 * @param {string | string[]} name - 需要查询的字段（支持单个或多个字段）
 * @returns {Promise<object | null>} - 返回查询到的数据或 null
 */
export async function getByKey (key, name = '*') {
  const queryOptions = {}

  if (name !== '*' && Array.isArray(name)) {
    queryOptions.attributes = name
  } else if (name !== '*') {
    queryOptions.attributes = [name]
  }

  const res = await table.findByPk(key, queryOptions)

  if (!res) return null

  if (typeof name === 'string' && name !== '*') {
    return res[name] ?? null
  }

  return res.toJSON()
}

/**
 * 通过指定字段查询数据（自动识别 JSON、字符串、数值）
 * @param {string} field - 字段名（可能是 JSON 数组、字符串或数值）
 * @param {string | number | string[] | number[]} value - 需要匹配的值（支持多个）
 * @param {string | string[]} returnField - 返回字段（默认 key）
 * @returns {Promise<object[]>} - 返回符合条件的记录数组
 */
export async function getByField (field, value, returnField = 'key') {
  if (!field) {
    throw new Error('查询字段不能为空')
  }

  const values = Array.isArray(value) ? value : [value]

  const conditions = values
    .map(v => {
      if (typeof v === 'number') {
        return `\`${field}\` = ${v}`
      } else {
        return `EXISTS (SELECT 1 FROM json_each(\`${field}\`) WHERE json_each.value = '${v}') OR \`${field}\` = '${v}'`
      }
    })
    .join(' AND ')

  const whereClause = sequelize.literal(`(${conditions})`)
  const attributes = Array.isArray(returnField) ? returnField : [returnField]

  const res = await table.findAll({
    attributes,
    where: whereClause
  })

  if (!Array.isArray(returnField)) {
    return res.map(item => item[returnField])
  }

  return res.map(item => item.toJSON())
}

/**
 * 通过字段名查询所有不同的值
 * @param {string} name - 需要查询的字段
 * @returns {Promise<any[]>} - 返回该字段的所有值数组
 */
export async function getAllSelect (name) {
  const res = await table.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col(name)), name]]
  })
  return res.map(item => item[name])
}

/**
 * 获取所有记录
 * @returns {Promise<object[]>} - 返回所有记录的数组
 */
export async function getAll () {
  return await table.findAll()
}