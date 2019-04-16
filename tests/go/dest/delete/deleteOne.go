import "github.com/mgenware/go-packagex/v5/dbx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable dbx.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
