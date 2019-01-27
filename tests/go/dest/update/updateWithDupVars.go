import "github.com/mgenware/go-packagex/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, postTitle string, postContent string, postContent2 string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `content` = ?, `title` = \"haha\" WHERE `title` = ? AND `content` = ?", postContent2, postTitle, postContent)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
