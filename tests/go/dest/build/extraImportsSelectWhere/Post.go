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
	PostDatetime time.Time
	PostDate     time.Time
}

// SelectTimes ...
func (da *TableTypePost) SelectTimes(queryable sqlx.Queryable, postNDatetime *time.Time, postNDate *time.Time) ([]*SelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `datetime`, `date` FROM `post` WHERE `n_datetime` = ? OR `n_date` = ?", postNDatetime, postNDate)
	if err != nil {
		return nil, err
	}
	result := make([]*SelectTimesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &SelectTimesResult{}
		err = rows.Scan(&item.PostDatetime, &item.PostDate)
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
