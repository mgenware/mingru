package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeDept ...
type TableTypeDept struct {
}

// Dept ...
var Dept = &TableTypeDept{}

// ------------ Actions ------------

// InsertDept ...
func (da *TableTypeDept) InsertDept(queryable mingru.Queryable, name string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `departments` (`dept_name`) VALUES (?)", name)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
