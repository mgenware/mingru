package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type EmployeeAGType struct {
}

var EmployeeAG = &EmployeeAGType{}

// ------------ Actions ------------

func (mrTable *EmployeeAGType) InsertT(mrQueryable mingru.Queryable, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`, `last_name`, `gender`, `birth_date`, `hire_date`) VALUES (?, ?, ?, ?, ?)", firstName, lastName, gender, birthDate, hireDate)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
