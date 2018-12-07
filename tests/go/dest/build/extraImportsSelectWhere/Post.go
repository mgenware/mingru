package da

import (
	"time"

	"github.com/mgenware/go-packagex/database/sqlx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// SelectTimesResult ...
type SelectTimesResult struct {
	PostID uint64
}

// SelectTimes ...
func (da *TableTypePost) SelectTimes(queryable sqlx.Queryable, postNDatetime *time.Time) ([]*SelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `id`, `n_id` FROM `post` WHERE `n_datetime` = ?", postNDatetime)
	if err != nil {
		return nil, err
	}
	result := make([]*SelectTimesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &SelectTimesResult{}
		err = rows.Scan(&item.PostID)
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
