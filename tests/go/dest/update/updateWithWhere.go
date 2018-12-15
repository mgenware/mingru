import "github.com/mgenware/go-packagex/database/sqlx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable sqlx.Queryable, postID uint64, postContent string, postContent2 string) error {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", postContent2, postID, postContent)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
