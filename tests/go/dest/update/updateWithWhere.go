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

func (mrTable *TableTypePost) UpdateT(mrQueryable mingru.Queryable, content string, id uint64, content2 string) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", content, id, content2)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
