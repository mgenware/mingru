package da

import "github.com/mgenware/mingru-go-lib"

type UserAGType struct {
}

var UserAG = &UserAGType{}

// ------------ Actions ------------

func (mrTable *UserAGType) UpdatePostCount(mrQueryable mingru.Queryable, id uint64, offset int) error {
	result, err := mrQueryable.Exec("UPDATE `user` SET `post_count` = `post_count` + ? WHERE `id` = ?", offset, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
