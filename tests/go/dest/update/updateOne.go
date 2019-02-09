import "github.com/mgenware/go-packagex/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, id uint64, content string) error {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?", content, id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
