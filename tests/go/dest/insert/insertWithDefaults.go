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

// InsertT ...
func (da *TableTypeCols) InsertT(queryable dbx.Queryable, fk uint64) error {
	_, err := queryable.Exec("INSERT INTO `cols` (`fk`, `text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`) VALUES (?, '', 0, NULL, -3, '一二', CURTIME())", fk)
	return err
}
