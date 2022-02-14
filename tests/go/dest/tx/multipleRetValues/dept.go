package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeDept struct {
}

var Dept = &TableTypeDept{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeDept) MingruSQLName() string {
	return "departments"
}

// ------------ Actions ------------

func (mrTable *TableTypeDept) InsertDept(mrQueryable mingru.Queryable, name string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `departments` (`dept_name`) VALUES (?)", name)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
