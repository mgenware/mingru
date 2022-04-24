package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypeEmployee struct {
}

var Employee = &TableTypeEmployee{}

// ------------ Actions ------------

func (mrTable *TableTypeEmployee) GetFirstName(mrQueryable mingru.Queryable, id int) (string, error) {
	var result string
	err := mrQueryable.QueryRow("SELECT `first_name` FROM `employees` WHERE `emp_no` = ?", id).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *TableTypeEmployee) Insert(mrQueryable mingru.Queryable, firstName string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *TableTypeEmployee) insert1Child2(mrQueryable mingru.Queryable, firstName string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *TableTypeEmployee) Insert1(db *sql.DB, id int) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		firstName, err := mrTable.GetFirstName(tx, id)
		if err != nil {
			return err
		}
		_, err = mrTable.insert1Child2(tx, firstName)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
