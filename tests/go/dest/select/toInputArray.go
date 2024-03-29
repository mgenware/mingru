package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGTResult struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, ids []uint64, idInput uint64, id []uint64) ([]PostAGTResult, error) {
	if len(ids) == 0 {
		return nil, fmt.Errorf("the array argument `ids` cannot be empty")
	}
	if len(id) == 0 {
		return nil, fmt.Errorf("the array argument `id` cannot be empty")
	}
	var queryParams []any
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
	var result []PostAGTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGTResult
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
