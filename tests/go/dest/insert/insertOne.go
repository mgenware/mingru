package da

import (
	"time"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeEmployee ...
type TableTypeEmployee struct {
}

// Employee ...
var Employee = &TableTypeEmployee{}

// ------------ Actions ------------

// InsertT ...
func (da *TableTypeEmployee) InsertT(queryable dbx.Queryable, id int, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `employees` (`emp_no`, `first_name`, `last_name`, `gender`, `birth_date`, `hire_date`) VALUES (?, ?, ?, ?, ?, ?)", id, firstName, lastName, gender, birthDate, hireDate)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
