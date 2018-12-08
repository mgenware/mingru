import "github.com/mgenware/go-packagex/database/sqlx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable sqlx.Queryable, postUserID uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `user_id` = ?", postUserID)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}
