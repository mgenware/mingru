package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) DeleteT(mrQueryable mingru.Queryable, id uint64) (int, error) {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
