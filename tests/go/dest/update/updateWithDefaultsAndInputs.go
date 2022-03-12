package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeCols struct {
}

var Cols = &TableTypeCols{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeCols) MingruSQLName() string {
	return "cols"
}

// ------------ Actions ------------

func (mrTable *TableTypeCols) UpdateT(mrQueryable mingru.Queryable, fk uint64, id uint64) error {
	result, err := mrQueryable.Exec("UPDATE `cols` SET `text` = '', `int` = 0, `nullable` = NULL, `fk` = ?, `def_int` = -3, `def_var_char` = '一二', `def_time` = CURTIME() WHERE `id` = ?", fk, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
