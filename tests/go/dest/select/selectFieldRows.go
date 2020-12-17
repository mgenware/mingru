package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) ([]string, error) {
	rows, err := queryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	result := make([]string, 0)
	defer rows.Close()
	for rows.Next() {
		var itemResult string
		err = rows.Scan(&itemResult)
		if err != nil {
			return nil, err
		}
		result = append(result, itemResult)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
