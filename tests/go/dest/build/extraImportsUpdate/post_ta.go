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

// UpdateNullableTimes ...
func (mrTable *TableTypePost) UpdateNullableTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `n_datetime` = ?, `n_date` = ?", nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

// UpdateTimes ...
func (mrTable *TableTypePost) UpdateTimes(mrQueryable mingru.Queryable, datetime time.Time, date time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `datetime` = ?, `date` = ?", datetime, date)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
