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

// UpdateNullableTimes ...
func (da *TableTypePost) UpdateNullableTimes(queryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `n_datetime` = ?, `n_date` = ?", nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

// UpdateTimes ...
func (da *TableTypePost) UpdateTimes(queryable mingru.Queryable, datetime time.Time, date time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `datetime` = ?, `date` = ?", datetime, date)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
