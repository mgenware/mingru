import "github.com/mgenware/go-packagex/database/sqlx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable sqlx.Queryable, postID uint64, postContent string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?", postContent, postID)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}
