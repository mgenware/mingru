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

// UpdateTimes ...
func (da *TableTypePost) UpdateTimes(queryable dbx.Queryable, postDatetime time.Time, postDate time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `datetime` = ?, `date` = ?", postDatetime, postDate)
	return dbx.GetRowsAffectedIntWithError(result, err)
}

// UpdateNullableTimes ...
func (da *TableTypePost) UpdateNullableTimes(queryable dbx.Queryable, postNDatetime *time.Time, postNDate *time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `n_datetime` = ?, `n_date` = ?", postNDatetime, postNDate)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
