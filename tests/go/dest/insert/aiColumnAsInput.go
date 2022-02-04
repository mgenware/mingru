package da

import (
	"time"

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

// InsertT ...
func (mrTable *TableTypeEmployee) InsertT(mrQueryable mingru.Queryable, id int, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`emp_no`, `first_name`, `last_name`, `gender`, `birth_date`, `hire_date`) VALUES (?, ?, ?, ?, ?, ?)", id, firstName, lastName, gender, birthDate, hireDate)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
