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
func (da *TableTypePost) UpdateTimes(queryable sqlx.Queryable, postDatetime time.Time, postDate time.Time) error {
	_, err := queryable.Exec("UPDATE `post` SET `datetime` = ?, `date` = ?", postDatetime, postDate)
	if err != nil {
		return err
	}
	return nil
}

// UpdateNullableTimes ...
func (da *TableTypePost) UpdateNullableTimes(queryable sqlx.Queryable, postNDatetime *time.Time, postNDate *time.Time) error {
	_, err := queryable.Exec("UPDATE `post` SET `n_datetime` = ?, `n_date` = ?", postNDatetime, postNDate)
	if err != nil {
		return err
	}
	return nil
}
