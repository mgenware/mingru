import "github.com/mgenware/go-packagex/dbx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable dbx.Queryable, postUserID uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `user_id` = ?", postUserID)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
