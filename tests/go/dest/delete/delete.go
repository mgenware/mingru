import "github.com/mgenware/go-packagex/dbx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable dbx.Queryable, id uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", id)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
