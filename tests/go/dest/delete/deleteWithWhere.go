import "github.com/mgenware/go-packagex/dbx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable dbx.Queryable, userID uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `user_id` = ?", userID)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
