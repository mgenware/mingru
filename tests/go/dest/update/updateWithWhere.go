import "github.com/mgenware/go-packagex/dbx"

// UpdateT ...
func (da *TableTypePost) UpdateT(queryable dbx.Queryable, postID uint64, postContent string, postContent2 string) error {
	result, err := queryable.Exec("UPDATE `post` SET `title` = \"haha\", `content` = ? WHERE `id` = ? AND `content` = ?", postContent2, postID, postContent)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
