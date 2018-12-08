package da

import (
	"time"

	"github.com/mgenware/go-packagex/database/sqlx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// DeleteTimes ...
func (da *TableTypePost) DeleteTimes(queryable sqlx.Queryable, postNDatetime *time.Time, postNDate *time.Time) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `n_datetime` = ? OR `n_date` = ?", postNDatetime, postNDate)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
