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

// SelectTime ...
func (da *TableTypePost) SelectTime(queryable sqlx.Queryable) (*time.Time, error) {
	var result *time.Time
	err := queryable.QueryRow("SELECT `n_datetime` FROM `post`").Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}
