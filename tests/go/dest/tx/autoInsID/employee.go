package da

import (
	"database/sql"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeEmployee ...
type TableTypeEmployee struct {
}

// Employee ...
var Employee = &TableTypeEmployee{}

// ------------ Actions ------------

// Insert ...
func (da *TableTypeEmployee) Insert(queryable dbx.Queryable, firstName string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}

// Insert2 ...
func (da *TableTypeEmployee) Insert2(db *sql.DB, firstName string) (uint64, error) {
	var insertedID uint64
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = da.Insert(tx, firstName)
		if err != nil {
			return err
		}
		insertedID, err = da.Insert(tx, firstName)
		if err != nil {
			return err
		}
		return nil
	})
	return insertedID, txErr
}