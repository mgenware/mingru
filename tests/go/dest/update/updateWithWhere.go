import "github.com/mgenware/go-packagex/v5/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, id uint64, content string, content2 string) error {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", content2, id, content)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
