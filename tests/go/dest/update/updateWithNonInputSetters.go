import "github.com/mgenware/go-packagex/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, content string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ?", content)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
