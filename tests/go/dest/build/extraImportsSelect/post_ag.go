package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableSelectNullableTimesResult struct {
	NDate     *time.Time
	NDatetime *time.Time
}

func (mrTable *TableTypePost) SelectNullableTimes(mrQueryable mingru.Queryable) ([]PostTableSelectNullableTimesResult, error) {
	rows, err := mrQueryable.Query("SELECT `n_datetime`, `n_date` FROM `db_post` ORDER BY `id`")
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

type PostTableSelectTimesResult struct {
	Date     time.Time
	Datetime time.Time
}

func (mrTable *TableTypePost) SelectTimes(mrQueryable mingru.Queryable) ([]PostTableSelectTimesResult, error) {
	rows, err := mrQueryable.Query("SELECT `datetime`, `date` FROM `db_post` ORDER BY `id`")
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
