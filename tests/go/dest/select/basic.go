import "github.com/mgenware/go-packagex/database/sqlx"

// SelectTResult ...
type SelectTResult struct {
	ID    int64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}

