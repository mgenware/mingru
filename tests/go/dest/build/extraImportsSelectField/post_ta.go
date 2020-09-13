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

// ------------ Actions ------------

// SelectTime ...
func (da *TableTypePost) SelectTime(queryable mingru.Queryable) (*time.Time, error) {
	var result *time.Time
	err := queryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
