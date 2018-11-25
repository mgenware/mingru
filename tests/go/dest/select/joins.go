import "github.com/mgenware/go-packagex/database/sqlx"

// SelectTResult ...
type SelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable, postID uint64, postTitle string) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post` WHERE `id` = ? && `title` != ?", postID, postTitle).Scan(&result.ID, &result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}

