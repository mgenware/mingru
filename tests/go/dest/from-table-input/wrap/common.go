package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUserT ...
type TableTypeUserT struct {
}

// UserT ...
var UserT = &TableTypeUserT{}

// ------------ Actions ------------

// Insert ...
func (da *TableTypeUserT) Insert(queryable mingru.Queryable, table string, tID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO "+table+" (`t_id`) VALUES (?)", table, tID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
