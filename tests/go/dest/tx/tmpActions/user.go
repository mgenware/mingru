package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeUser struct {
}

var User = &TableTypeUser{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUser) MingruSQLName() string {
	return "user"
}

// ------------ Actions ------------

func (mrTable *TableTypeUser) UpdatePostCount(mrQueryable mingru.Queryable, id uint64, offset int) error {
	result, err := mrQueryable.Exec("UPDATE `user` SET `post_count` = `post_count` + ? WHERE `id` = ?", offset, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
