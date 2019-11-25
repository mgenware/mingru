package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeDept ...
type TableTypeDept struct {
}

// Dept ...
var Dept = &TableTypeDept{}

// ------------ Actions ------------

// InsertDept ...
func (da *TableTypeDept) InsertDept(queryable dbx.Queryable, name string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `departments` (`dept_name`) VALUES (?)", name)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
