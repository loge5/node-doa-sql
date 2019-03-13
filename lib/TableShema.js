const TableColumn = require('./TableColumn')

class TableShema {
  constructor () {
    /**
     * @member {string}
     */
    this.name = []
    /**
     * @member {TableColumn[]}
     */
    this.columns = []
    /**
     * @member {string}
     */
    this.primaryKey = undefined
  }
}

module.exports = TableShema