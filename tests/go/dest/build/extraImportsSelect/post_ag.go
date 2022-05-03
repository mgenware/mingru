package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectNullableTimesResult struct {
	NDate     *time.Time
	NDatetime *time.Time
}

func (mrTable *PostAGType) SelectNullableTimes(mrQueryable mingru.Queryable) ([]PostAGSelectNullableTimesResult, error) {
	rows, err := mrQueryable.Query("SELECT `n_datetime`, `n_date` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectNullableTimesResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectNullableTimesResult
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

type PostAGSelectTimesResult struct {
	Date     time.Time
	Datetime time.Time
}

func (mrTable *PostAGType) SelectTimes(mrQueryable mingru.Queryable) ([]PostAGSelectTimesResult, error) {
	rows, err := mrQueryable.Query("SELECT `datetime`, `date` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTimesResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTimesResult
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
