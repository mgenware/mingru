import "github.com/mgenware/go-packagex/database/sqlx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable sqlx.Queryable, postContent string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ?", postContent)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}
