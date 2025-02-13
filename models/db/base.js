import { Sequelize, DataTypes, Op, fn, col } from 'sequelize'
import * as Utils from '../Utils/index.js'
import { Version } from '#components'
import fs from 'node:fs'
import chalk from 'chalk'

const dbPath = `${Version.Plugin_Path}/data/data.db`
if(!Utils.Tools.fileExistsAsync(dbPath)){
  fs.mkdirSync(dbPath)
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: `${dbPath}`,
  logging: false
})
/** 测试连接 */
try {
  await sequelize.authenticate()
  logger.debug(chalk.bold.cyan(`[${Version.Plugin_AliasName}] 数据库连接成功`))
} catch (error) {
  logger.error(chalk.bold.cyan(`[${Version.Plugin_AliasName}] 数据库连接失败: ${error}`))
}

export {
  Op,
  fn,
  col,
  DataTypes,
  sequelize
}