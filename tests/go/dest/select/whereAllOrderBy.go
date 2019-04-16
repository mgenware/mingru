import "github.com/mgenware/go-packagex/v5/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	N     int
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, id uint64) ([]*PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, RAND() AS `n`, `title` FROM `post` WHERE `id` = ?`title`, `n`, `title` DESC", id)
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTResult{}
		err = rows.Scan(&item.ID, &item.N, &item.Title)
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
