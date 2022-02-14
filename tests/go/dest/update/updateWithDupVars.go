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

func (mrTable *TableTypePost) UpdateT(mrQueryable mingru.Queryable, title string, content string, content2 string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\" WHERE (`title` = ? AND `content` = ?)", content2, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
