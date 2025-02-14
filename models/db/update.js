import { sequelize, DataTypes } from './base.js'

export const table = sequelize.define('update', {
  branch: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    unique: true
  },
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

export async function add (branch, sha) {
  const existingRecord = await table.findOne({ where: { branch, sha } })

  if (existingRecord) {
    return await existingRecord.update({ branch, sha })
  } else {
    return await table.create({ branch, sha })
  }
}


export async function get (branch) {
  return await table.findOne({
    where: {
      branch
    }
  })
}

export async function getAll () {
  return await table.findAll()
}