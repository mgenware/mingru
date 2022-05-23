package da

import "github.com/mgenware/mingru-go-lib"

type ColsAGType struct {
}

var Cols = &ColsAGType{}

// ------------ Actions ------------

func (mrTable *ColsAGType) InsertT(mrQueryable mingru.Queryable, fk uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `cols` (`text`, `nullable`, `def_int`, `def_var_char`, `def_time`, `int`, `fk`) VALUES ('', NULL, -3, '一二', CURTIME(), `fk`, ?)", fk)
	return err
}
