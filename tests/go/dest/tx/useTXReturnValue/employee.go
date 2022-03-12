package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypeEmployee struct {
}

var Employee = &TableTypeEmployee{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeEmployee) MingruSQLName() string {
	return "employees"
}

// ------------ Actions ------------

func (mrTable *TableTypeEmployee) Insert(mrQueryable mingru.Queryable, firstName string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *TableTypeEmployee) Insert2(db *sql.DB, firstName string) (uint64, error) {
	var id2Exported uint64
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.Insert(tx, firstName)
		if err != nil {
			return err
		}
		id2, err := mrTable.Insert(tx, firstName)
		if err != nil {
			return err
		}
		id2Exported = id2
		return nil
	})
	return id2Exported, txErr
}

func (mrTable *TableTypeEmployee) Insert3(db *sql.DB, firstName string) (uint64, error) {
	var id3Exported uint64
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.Insert(tx, firstName)
		if err != nil {
			return err
		}
		id3, err := mrTable.Insert2(tx, firstName)
		if err != nil {
			return err
		}
		id3Exported = id3
		return nil
	})
	return id3Exported, txErr
}
