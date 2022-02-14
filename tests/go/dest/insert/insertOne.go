package da

import (
	"time"

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

func (mrTable *TableTypeEmployee) InsertT(mrQueryable mingru.Queryable, firstName string, lastName string, gender string, birthDate time.Time, hireDate time.Time) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `employees` (`first_name`, `last_name`, `gender`, `birth_date`, `hire_date`) VALUES (?, ?, ?, ?, ?)", firstName, lastName, gender, birthDate, hireDate)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
