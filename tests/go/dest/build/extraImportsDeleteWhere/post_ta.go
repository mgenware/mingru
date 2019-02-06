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
func (da *TableTypePost) DeleteTimes(queryable dbx.Queryable, postNDatetime *time.Time, postNDate *time.Time) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `n_datetime` = ? OR `n_date` = ?", postNDatetime, postNDate)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
