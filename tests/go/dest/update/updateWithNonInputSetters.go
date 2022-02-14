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

func (mrTable *TableTypePost) UpdateT(mrQueryable mingru.Queryable, content string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = \"haha\", `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
