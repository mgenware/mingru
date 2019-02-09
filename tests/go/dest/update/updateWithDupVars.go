import "github.com/mgenware/go-packagex/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, title string, content string, content2 string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `content` = ?, `title` = \"haha\" WHERE `title` = ? AND `content` = ?", content2, title, content)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
