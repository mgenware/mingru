package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// UpdatePostCount ...
func (da *TableTypeUser) UpdatePostCount(queryable mingru.Queryable, id uint64, offset int) error {
	result, err := queryable.Exec("UPDATE `user` SET `post_count` = `post_count` + ? WHERE `id` = ?", offset, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
