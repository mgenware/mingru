package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeDept ...
type TableTypeDept struct {
}

// Dept ...
var Dept = &TableTypeDept{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeDept) MingruSQLName() string {
	return "departments"
}

// ------------ Actions ------------

// InsertDept ...
func (mrTable *TableTypeDept) InsertDept(mrQueryable mingru.Queryable, name string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `departments` (`dept_name`) VALUES (?)", name)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
