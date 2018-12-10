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

// UpdateTimes ...
func (da *TableTypePost) UpdateTimes(queryable sqlx.Queryable, postDatetime time.Time) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `datetime` = ? WHERE `n_datetime` = ? OR `n_date` = ?", postDatetime)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}