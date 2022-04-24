package da

import "github.com/mgenware/mingru-go-lib"

type ColsAGType struct {
}

var ColsAG = &ColsAGType{}

// ------------ Actions ------------

func (mrTable *ColsAGType) UpdateT(mrQueryable mingru.Queryable, id uint64, fk uint64) error {
	result, err := mrQueryable.Exec("UPDATE `cols` SET `text` = '', `int` = 0, `nullable` = NULL, `fk` = ?, `def_int` = -3, `def_var_char` = '一二', `def_time` = CURTIME() WHERE `id` = ?", fk, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
