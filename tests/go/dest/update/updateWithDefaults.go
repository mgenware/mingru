package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeCols ...
type TableTypeCols struct {
}

// Cols ...
var Cols = &TableTypeCols{}

// ------------ Actions ------------

// UpdateT ...
func (da *TableTypeCols) UpdateT(queryable dbx.Queryable, id uint64, fk uint64) error {
	result, err := queryable.Exec("UPDATE `cols` SET `fk` = ?, `text` = '', `int` = 0, `nullable` = NULL, `def_int` = -3, `def_var_char` = '一二', `def_time` = CURTIME() WHERE `id` = ?", fk, id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
