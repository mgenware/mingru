import "github.com/mgenware/go-packagex/dbx"

// SelectTResult ...
type SelectTResult struct {
	PostID    uint64
	PostTitle string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) ([]*SelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `post`")
	if err != nil {
		return nil, err
	}
	result := make([]*SelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &SelectTResult{}
		err = rows.Scan(&item.PostID, &item.PostTitle)
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
