package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable, offsetVar int) ([]PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id` LIMIT 10 OFFSET ?", offsetVar)
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
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
