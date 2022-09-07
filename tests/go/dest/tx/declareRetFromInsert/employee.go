package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type EmployeeAGType struct {
}

var Employee = &EmployeeAGType{}

// ------------ Actions ------------

func (mrTable *EmployeeAGType) Insert(mrQueryable mingru.Queryable, firstName string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *EmployeeAGType) insert2Child2(mrQueryable mingru.Queryable, id int) (string, error) {
	var result string
	err := mrQueryable.QueryRow("SELECT `first_name` FROM `employees` WHERE `emp_no` = ?", id).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *EmployeeAGType) Insert2(db *sql.DB, firstName string, id int) (uint64, error) {
	var id2Exported uint64
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.Insert(tx, firstName)
		if err != nil {
			return err
		}
		firstName, err := mrTable.insert2Child2(tx, id)
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
