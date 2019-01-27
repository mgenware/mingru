import "github.com/mgenware/go-packagex/dbx"

// DeleteT ...
func (da *TableTypePost) DeleteT(queryable dbx.Queryable, postID uint64) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", postID)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
