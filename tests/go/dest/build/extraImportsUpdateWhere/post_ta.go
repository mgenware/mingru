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

// ------------ Actions ------------

// UpdateTimes ...
func (da *TableTypePost) UpdateTimes(queryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time, datetime time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `datetime` = ? WHERE `n_datetime` = ? OR `n_date` = ?", datetime, nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
