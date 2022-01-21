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
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// DeleteTimes ...
func (da *TableTypePost) DeleteTimes(queryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) error {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `n_datetime` = ? OR `n_date` = ?", nDatetime, nDate)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
