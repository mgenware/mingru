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

// SelectTime ...
func (da *TableTypePost) SelectTime(queryable dbx.Queryable) (*time.Time, error) {
	var result *time.Time
	err := queryable.QueryRow("SELECT `n_datetime` FROM `post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
