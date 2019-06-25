package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeDeptManager ...
type TableTypeDeptManager struct {
}

// DeptManager ...
var DeptManager = &TableTypeDeptManager{}

// ------------ Actions ------------

// Insert ...
func (da *TableTypeDeptManager) Insert(db *sql.DB, id int, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time, no string, name string, empNo int, deptNo string, fromDate time.Time, toDate time.Time) error {
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = Employee.Insert(tx, id, firstName, lastName, gender, birthDate, hireDate)
		if err != nil {
			return err
		}
		err = Dept.Insert(tx, no, name)
		if err != nil {
			return err
		}
		err = da.InsertCore(tx, empNo, deptNo, fromDate, toDate)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

// InsertCore ...
func (da *TableTypeDeptManager) InsertCore(queryable dbx.Queryable, empNo int, deptNo string, fromDate time.Time, toDate time.Time) error {
	_, err := queryable.Exec("INSERT INTO `dept_manager` (`emp_no`, `dept_no`, `from_date`, `to_date`) VALUES (?, ?, ?, ?)", empNo, deptNo, fromDate, toDate)
	return err
}
