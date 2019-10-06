package da

import (
	"time"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTimesResult ...
type PostTableSelectTimesResult struct {
	Datetime time.Time
	Date     time.Time
}

// SelectTimes ...
func (da *TableTypePost) SelectTimes(queryable dbx.Queryable, nDatetime *time.Time, nDate *time.Time) ([]*PostTableSelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `datetime`, `date` FROM `db_post` WHERE `n_datetime` = ? OR `n_date` = ? ORDER BY `id`", nDatetime, nDate)
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTimesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTimesResult{}
		err = rows.Scan(&item.Datetime, &item.Date)
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
