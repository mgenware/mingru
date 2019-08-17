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

// PostTableSelectNullableTimesResult ...
type PostTableSelectNullableTimesResult struct {
	NDatetime *time.Time
	NDate     *time.Time
}

// SelectNullableTimes ...
func (da *TableTypePost) SelectNullableTimes(queryable dbx.Queryable) ([]*PostTableSelectNullableTimesResult, error) {
	rows, err := queryable.Query("SELECT `n_datetime`, `n_date` FROM `post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectNullableTimesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectNullableTimesResult{}
		err = rows.Scan(&item.NDatetime, &item.NDate)
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

// PostTableSelectTimesResult ...
type PostTableSelectTimesResult struct {
	Datetime time.Time
	Date     time.Time
}

// SelectTimes ...
func (da *TableTypePost) SelectTimes(queryable dbx.Queryable) ([]*PostTableSelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `datetime`, `date` FROM `post` ORDER BY `id`")
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
