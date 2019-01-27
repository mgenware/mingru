import "github.com/mgenware/go-packagex/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, postID uint64, postContent string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ?, `cmt_c` = `cmt_c` + 1 WHERE `id` = ?", postContent, postID)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
