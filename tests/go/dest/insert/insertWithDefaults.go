package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeCols struct {
}

var Cols = &TableTypeCols{}

// ------------ Actions ------------

func (mrTable *TableTypeCols) InsertT(mrQueryable mingru.Queryable, fk uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `cols` (`fk`, `text`, `int`, `nullable`, `def_int`, `def_var_char`, `def_time`) VALUES (?, '', 0, NULL, -3, '一二', CURTIME())", fk)
	return err
}
