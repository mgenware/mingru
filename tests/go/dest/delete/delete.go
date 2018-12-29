import "github.com/mgenware/go-packagex/database/sqlx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable sqlx.Queryable, postID uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", postID)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}
