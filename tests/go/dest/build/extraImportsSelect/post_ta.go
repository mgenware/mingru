package da

import (
	"time"

	"github.com/mgenware/go-packagex/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTimesResult ...
type PostTableSelectTimesResult struct {
	PostDatetime time.Time
	PostDate     time.Time
}

// SelectTimes ...
func (da *TableTypePost) SelectTimes(queryable dbx.Queryable) ([]*PostTableSelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `datetime`, `date` FROM `post`")
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTimesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTimesResult{}
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

// PostTableSelectNullableTimesResult ...
type PostTableSelectNullableTimesResult struct {
	PostNDatetime *time.Time
	PostNDate     *time.Time
}

// SelectNullableTimes ...
func (da *TableTypePost) SelectNullableTimes(queryable dbx.Queryable) ([]*PostTableSelectNullableTimesResult, error) {
	rows, err := queryable.Query("SELECT `n_datetime`, `n_date` FROM `post`")
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectNullableTimesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectNullableTimesResult{}
		err = rows.Scan(&item.PostNDatetime, &item.PostNDate)
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
