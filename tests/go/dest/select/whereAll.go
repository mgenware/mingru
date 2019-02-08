import "github.com/mgenware/go-packagex/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	PostID    uint64
	PostTitle string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, postID uint64) ([]*PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `post` WHERE `id` = ?", postID)
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTResult{}
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
