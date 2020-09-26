package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	ID    uint64
	Title string
}

// T ...
func (da *TableTypePost) T(queryable mingru.Queryable, ids []uint64, idInput uint64, ids2 []uint64) ([]*PostTableTResult, error) {
	if len(ids) == 0 {
		return nil, fmt.Errorf("The array argument `ids` cannot be empty")
	}
	if len(ids2) == 0 {
		return nil, fmt.Errorf("The array argument `ids2` cannot be empty")
	}
	var queryParams []interface{}
	queryParams = append(queryParams, ids...)
	queryParams = append(queryParams, idInput)
	queryParams = append(queryParams, ids2...)
	rows, err := queryable.Query("SELECT `id`, `title` FROM `db_post` WHERE `id` IN "+mingru.InputPlaceholders(len(ids))+" OR `id` <> ? OR `id` IN "+mingru.InputPlaceholders(len(ids2))+" ORDER BY `id`", queryParams...)
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableTResult{}
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
