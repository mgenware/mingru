package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) UpdateT(mrQueryable mingru.Queryable, id uint64, content string) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?", content, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
