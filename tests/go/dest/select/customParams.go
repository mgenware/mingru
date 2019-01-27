import "github.com/mgenware/go-packagex/dbx"

// SelectTResult ...
type SelectTResult struct {
	PostID    uint64
	PostTitle string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, id uint64, name string) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post` WHERE `id` = ? && raw_name = ?", id, name).Scan(&result.PostID, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}
