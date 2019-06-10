import "github.com/mgenware/go-packagex/v5/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, limit int, offset int) ([]*PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `post` LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTResult, 0, limit)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTResult{}
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
