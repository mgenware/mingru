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

func (mrTable *TableTypePost) UpdateT(mrQueryable mingru.Queryable, content string, mUserID uint64, title string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `content` = ?, `title` = \"haha\", `my_user_id` = ? WHERE `title` = ? `title` = ? AND `content` = ?", content, mUserID, title, title, content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
