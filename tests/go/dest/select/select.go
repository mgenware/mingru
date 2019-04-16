import "github.com/mgenware/go-packagex/v5/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}
