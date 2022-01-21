package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUserT ...
type TableTypeUserT struct {
}

// UserT ...
var UserT = &TableTypeUserT{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUserT) MingruSQLName() string {
	return "user_t"
}

// ------------ Actions ------------

// Insert ...
func (mrTable *TableTypeUserT) Insert(queryable mingru.Queryable, mrFromTable mingru.Table, tID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO "+mrFromTable.MingruSQLName()+" (`t_id`) VALUES (?)", tID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
