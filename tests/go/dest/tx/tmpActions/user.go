package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// UpdatePostCount ...
func (da *TableTypeUser) UpdatePostCount(queryable dbx.Queryable, id uint64, offset int) error {
	result, err := queryable.Exec("UPDATE `user` SET `post_count` = `post_count` + ? WHERE `id` = ?", offset, id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
