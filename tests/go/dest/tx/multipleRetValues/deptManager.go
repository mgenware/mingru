package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type DeptManagerAGType struct {
}

var DeptManager = &DeptManagerAGType{}

// ------------ Actions ------------

func (mrTable *DeptManagerAGType) insertChild3(mrQueryable mingru.Queryable, empNo int, deptNo uint64, fromDate time.Time, toDate time.Time) error {
	return mrTable.InsertCore(mrQueryable, empNo, deptNo, fromDate, toDate)
}

func (mrTable *DeptManagerAGType) Insert(db *sql.DB, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time, name string, fromDate time.Time, toDate time.Time) (uint64, uint64, error) {
	var deptNoExported uint64
	var empNoExported uint64
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		empNo, err := Employee.InsertEmp(tx, firstName, lastName, gender, birthDate, hireDate)
		if err != nil {
			return err
		}
		deptNo, err := Dept.InsertDept(tx, name)
		if err != nil {
			return err
		}
		err = mrTable.insertChild3(tx, empNo, deptNo, fromDate, toDate)
		if err != nil {
			return err
		}
		deptNoExported = deptNo
		empNoExported = empNo
		return nil
	})
	return deptNoExported, empNoExported, txErr
}

func (mrTable *DeptManagerAGType) InsertCore(mrQueryable mingru.Queryable, empNo int, deptNo uint64, fromDate time.Time, toDate time.Time) error {
	_, err := mrQueryable.Exec("INSERT INTO `dept_manager` (`emp_no`, `dept_no`, `from_date`, `to_date`) VALUES (?, ?, ?, ?)", empNo, deptNo, fromDate, toDate)
	return err
}
