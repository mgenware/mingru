package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable, limit int, offset int, max int) ([]PostTableSelectTResult, int, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id` LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]PostTableSelectTResult, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item PostTableSelectTResult
			err = rows.Scan(&item.ID, &item.Title)
			if err != nil {
				return nil, 0, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, 0, err
	}
	return result, itemCounter, nil
}
