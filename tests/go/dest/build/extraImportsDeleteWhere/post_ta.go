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

// DeleteTimes ...
func (da *TableTypePost) DeleteTimes(queryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) error {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `n_datetime` = ? OR `n_date` = ?", nDatetime, nDate)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
