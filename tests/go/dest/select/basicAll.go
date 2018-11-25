import "github.com/mgenware/go-packagex/database/sqlx"

// SelectTResult ...
type SelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable) ([]*SelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `post`")
	if err != nil {
		return nil, err
	}
	result := make([]*SelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &SelectTResult{}
		err = rows.Scan(&item.ID, &item.Title)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
