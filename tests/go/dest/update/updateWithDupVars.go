import "github.com/mgenware/go-packagex/database/sqlx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable sqlx.Queryable, postTitle string, postContent string, postContent2 string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `content` = ?, `title` = \"haha\" WHERE `title` = ? AND `content` = ?", postContent2, postTitle, postContent)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}
