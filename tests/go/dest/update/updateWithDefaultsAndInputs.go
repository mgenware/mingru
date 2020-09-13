package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeCols ...
type TableTypeCols struct {
}

// Cols ...
var Cols = &TableTypeCols{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypeCols) UpdateT(queryable mingru.Queryable, id uint64, fk uint64) error {
	result, err := queryable.Exec("UPDATE `cols` SET `text` = '', `int` = 0, `nullable` = NULL, `fk` = ?, `def_int` = -3, `def_var_char` = '一二', `def_time` = CURTIME() WHERE `id` = ?", fk, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
