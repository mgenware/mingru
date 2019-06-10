package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
	"time"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// UpdateNullableTimes ...
func (da *TableTypePost) UpdateNullableTimes(queryable dbx.Queryable, nDatetime *time.Time, nDate *time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `n_datetime` = ?, `n_date` = ?", nDatetime, nDate)
	return dbx.GetRowsAffectedIntWithError(result, err)
}

// UpdateTimes ...
func (da *TableTypePost) UpdateTimes(queryable dbx.Queryable, datetime time.Time, date time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `datetime` = ?, `date` = ?", datetime, date)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
