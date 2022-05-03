package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectTimesResult struct {
	Date     time.Time
	Datetime time.Time
}

func (mrTable *PostAGType) SelectTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) ([]PostAGSelectTimesResult, error) {
	rows, err := mrQueryable.Query("SELECT `datetime`, `date` FROM `db_post` WHERE `n_datetime` = ? OR `n_date` = ? ORDER BY `id`", nDatetime, nDate)
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
