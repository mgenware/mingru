package da

import "github.com/mgenware/mingru-go-lib"

type DeptAGType struct {
}

var DeptAG = &DeptAGType{}

// ------------ Actions ------------

func (mrTable *DeptAGType) InsertDept(mrQueryable mingru.Queryable, name string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `departments` (`dept_name`) VALUES (?)", name)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
