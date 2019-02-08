import "github.com/mgenware/go-packagex/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	PostID    uint64
	PostTitle string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, postID uint64) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post` WHERE `id` = ?", postID).Scan(&result.PostID, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}
