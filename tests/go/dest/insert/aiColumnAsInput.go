package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type EmployeeAGType struct {
}

var Employee = &EmployeeAGType{}

// ------------ Actions ------------

func (mrTable *EmployeeAGType) InsertT(mrQueryable mingru.Queryable, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time, id int) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`, `last_name`, `gender`, `birth_date`, `hire_date`, `emp_no`) VALUES (?, ?, ?, ?, ?, ?)", firstName, lastName, gender, birthDate, hireDate, id)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
