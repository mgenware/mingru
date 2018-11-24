import "github.com/mgenware/go-packagex/database/sqlx"

// SelectTResult ...
type SelectTResult struct {
	ID    int64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable) (*SelectTResult, error) {
	res := &SelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&res.ID, &res.Title)
	if err != nil {
		return nil, err
	}
	return res, nil
}

