import "github.com/mgenware/go-packagex/v5/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, title string, content string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `content` = ?, `title` = \"haha\" WHERE `title` = ? AND `content` = ?", content, title)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
