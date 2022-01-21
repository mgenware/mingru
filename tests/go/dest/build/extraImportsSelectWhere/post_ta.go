package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

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

// PostTableSelectTimesResult ...
type PostTableSelectTimesResult struct {
	Date     time.Time
	Datetime time.Time
}

// SelectTimes ...
func (da *TableTypePost) SelectTimes(queryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) ([]PostTableSelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `datetime`, `date` FROM `db_post` WHERE `n_datetime` = ? OR `n_date` = ? ORDER BY `id`", nDatetime, nDate)
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTimesResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTimesResult
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
