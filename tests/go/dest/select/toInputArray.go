package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableTResult struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, ids []uint64, idInput uint64, id []uint64) ([]PostTableTResult, error) {
	if len(ids) == 0 {
		return nil, fmt.Errorf("The array argument `ids` cannot be empty")
	}
	if len(id) == 0 {
		return nil, fmt.Errorf("The array argument `id` cannot be empty")
	}
	var queryParams []interface{}
	for _, item := range ids {
		queryParams = append(queryParams, item)
	}
	queryParams = append(queryParams, idInput)
	for _, item := range id {
		queryParams = append(queryParams, item)
	}
	rows, err := mrQueryable.Query("SELECT `id`, `title` FROM `db_post` WHERE `id` IN "+mingru.InputPlaceholders(len(ids))+" OR `id` <> ? OR `id` IN "+mingru.InputPlaceholders(len(id))+" ORDER BY `id`", queryParams...)
	if err != nil {
		return nil, err
	}
	var result []PostTableTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableTResult
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
