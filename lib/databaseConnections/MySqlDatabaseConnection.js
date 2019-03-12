const mysql = require('mysql')
const DatabaseConnection = require('../DatabaseConnection')

class MySqlDatabaseConnection extends DatabaseConnection {
  /**
   * @returns {*} transaction
   */
  async createTransaction () {
    return new Promise((resolve, reject) => {
      let connection = mysql.createConnection(this.config)
      connection.connect((err) => {
        if (err) {
          reject(err)
          return
        }
        connection.beginTransaction((err) => {
          if (err) {
            reject(err)
            return
          }
          resolve(connection)
        })
      })
    })
  }
  /**
   * @param {*} transaction
   */
  async commitTransaction (transaction) {
    return new Promise((resolve, reject) => {
      transaction.commit((e) => {
        transaction.end()
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
    })
  }
  /**
   * @param {*} transaction
   */
  async rollbackTransaction (transaction) {
    return new Promise((resolve, reject) => {
      transaction.rollback((e) => {
        transaction.end()
        if (e) {
          reject(e)
        } else {
          resolve()
        }
      })
    })
  }
  /**
   * @param {string} query
   * @param {*} transaction
   */
  async sendQuery (query, transaction = undefined) {
    return new Promise((resolve, reject) => {
      let connection
      if (typeof transaction === 'object') {
        connection = transaction
      } else {
        connection = mysql.createConnection(this.config)
        connection.connect()
      }
      connection.query(query, (error, results, fields) => {
        if (error) {
          reject(error)
        } else {
          resolve(results)
        }
      })
      connection.end()
    })
  }
  /**
   * @param {string} tableName
   * @param {Map<string, any>} attributeMap <column, value>
   */
  createInsertQuery (tableName, attributeMap) {
    let placeHolderCols = new Array(attributeMap.size).fill('??').join(',')
    let placeHolderVals = new Array(attributeMap.size).fill('?').join(',')
    let sql = `INSERT INTO ?? (${placeHolderCols}) VALUES(${placeHolderVals})`
    let values = [tableName]
    values = values.concat(Array.from(attributeMap.keys()))
    values = values.concat(Array.from(attributeMap.values()))
    return mysql.format(sql, values)
  }
  /**
   * @param {string} tableName
   * @param {WhereClause} whereClause
   */
  createFindQuery (tableName, whereClause = undefined) {
    let sql = `SELECT * FROM ??`
    let values = [tableName]
    if (typeof whereClause === 'object') {
      sql += ' WHERE ' + whereClause.clause
      values = values.concat(whereClause.values)
    }
    return mysql.format(sql, values)
  }
  /**
   * @param {string} tableName
   * @param {Map<string, any>} attributeMap <column, value>
   */
  createUpdateQuery (tableName, attributeMap) {
    let sql = `UPDATE ?? SET ${Array(attributeMap.size).fill('?? = ?').join(',')}`
    let values = [tableName]
    for (var [attr, value] of attributeMap.entries()) {
      values.push(attr)
      values.push(value)
    }
    return mysql.format(sql, values)
  }
  /**
   * @param {string} tableName
   * @param {WhereClause} whereClause
   */
  createDeleteQuery (tableName, whereClause = undefined) {
    let sql = `DELETE FROM ??`
    let values = [tableName]
    if (typeof whereClause === 'object') {
      sql += ' WHERE ' + whereClause.clause
      values = values.concat(whereClause.values)
    }
    return mysql.format(sql, values)
  }
  /**
   * @param {string} tableName
   * @param {Map<string, any>} attributeMap <column, value>
   */
  createSaveQuery (tableName, attributeMap) {
    let placeHolderCols = new Array(attributeMap.size).fill('??').join(',')
    let placeHolderVals = new Array(attributeMap.size).fill('?').join(',')
    let placeHolderUpdate = Array(attributeMap.size).fill('?? = ?').join(',')
    let sql = `INSERT INTO ?? (${placeHolderCols}) VALUES(${placeHolderVals}) ON DUPLICATE KEY UPDATE ${placeHolderUpdate}`
    let values = [tableName]
    values = values.concat(Array.from(attributeMap.keys()))
    values = values.concat(Array.from(attributeMap.values()))
    for (var [attr, value] of attributeMap.entries()) {
      values.push(attr)
      values.push(value)
    }
    return mysql.format(sql, values)
  }
  /**
   * @params {*} result
   * @returns {number|string}
   */
  parsePrimaryKeyFromResult (result) {
    if (typeof result.insertId !== 'number' || result.insertId === 0) {
      throw new Error('cant parse inserted id')
    }
    return result.insertId
  }
  /**
   * @params {*} result
   * @returns {number|string}
   */
  parseUpdatedRowsFromResult (result) {
    return result.affectedRows
  }
  /**
   * @params {*} result
   * @returns {number|string}
   */
  parseDeletedRowsFromResult (result) {
    return result.affectedRows
  }
  /**
   * @params {*} result
   * @params {string[]} attributes
   * @returns {Map<string, any>[]} <column, value>
   */
  parseAttributeMapsFromResult (result, attributes) {
    let maps = []
    for (let row of result) {
      let m = new Map()
      for (let attr of attributes) {
        m.set(attr, row[attr])
      }
      maps.push(m)
    }
    return maps
  }
}

module.exports = MySqlDatabaseConnection