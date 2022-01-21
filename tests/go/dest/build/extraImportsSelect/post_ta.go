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
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableSelectNullableTimesResult ...
type PostTableSelectNullableTimesResult struct {
	NDate     *time.Time
	NDatetime *time.Time
}

// SelectNullableTimes ...
func (mrTable *TableTypePost) SelectNullableTimes(queryable mingru.Queryable) ([]PostTableSelectNullableTimesResult, error) {
	rows, err := queryable.Query("SELECT `n_datetime`, `n_date` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectNullableTimesResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectNullableTimesResult
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
	Date     time.Time
	Datetime time.Time
}

// SelectTimes ...
func (mrTable *TableTypePost) SelectTimes(queryable mingru.Queryable) ([]PostTableSelectTimesResult, error) {
	rows, err := queryable.Query("SELECT `datetime`, `date` FROM `db_post` ORDER BY `id`")
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
