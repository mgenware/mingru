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

// UpdateTimes ...
func (da *TableTypePost) UpdateTimes(queryable dbx.Queryable, nDatetime *time.Time, nDate *time.Time, datetime time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `datetime` = ? WHERE `n_datetime` = ? OR `n_date` = ?", datetime, nDatetime, nDate)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
