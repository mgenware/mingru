package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypeEmployee ...
type TableTypeEmployee struct {
}

// Employee ...
var Employee = &TableTypeEmployee{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeEmployee) MingruSQLName() string {
	return "employees"
}

// ------------ Actions ------------

// GetFirstName ...
func (mrTable *TableTypeEmployee) GetFirstName(queryable mingru.Queryable, id int) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `first_name` FROM `employees` WHERE `emp_no` = ?", id).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}

// Insert ...
func (mrTable *TableTypeEmployee) Insert(queryable mingru.Queryable, firstName string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *TableTypeEmployee) insert1Child2(queryable mingru.Queryable, firstName string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `employees` (`first_name`) VALUES (?)", firstName)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

// Insert1 ...
func (mrTable *TableTypeEmployee) Insert1(db *sql.DB, id int) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		firstName, err := da.GetFirstName(tx, id)
		if err != nil {
			return err
		}
		_, err = da.insert1Child2(tx, firstName)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
