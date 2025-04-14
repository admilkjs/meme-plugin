import { DataTypes, sequelize } from './base.js'

/**
* 定义 'update' 表模型，用于存储分支和 SHA 值。
* @type {Sequelize.Model}
*/
export const table = sequelize.define('update', {
  /**
  * 分支名称
  * @type {DataTypes.STRING}
  */
  branch: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    unique: true
  },
  /**
  * SHA 值
  * @type {DataTypes.STRING}
  */
  sha: {
    type: DataTypes.STRING,
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
* 添加或更新分支信息。
*
* @async
* @function add
* @param {string} branch - 分支名称。
* @param {string} sha - 分支对应的 SHA 值。
* @returns 返回创建或更新的记录
*/
export async function add (branch, sha) {
  const existingRecord = await table.findOne({ where: { branch }, raw: false })

  if (existingRecord) {
    return await existingRecord.update({ sha })
  } else {
    return await table.create({ branch, sha })
  }
}

/**
* 获取指定分支的信息。
*
* @async
* @function get
* @param {string} branch - 分支名称。
* @returns 返回查询到的记录，如果不存在则返回 null。
*/
export async function get (branch) {
  return await table.findOne({
    where: {
      branch
    }
  })
}

/**
* 获取所有分支的信息。
*
* @async
* @function getAll
* @returns 返回包含所有分支信息的数组。
*/
export async function getAll () {
  return await table.findAll()
}
