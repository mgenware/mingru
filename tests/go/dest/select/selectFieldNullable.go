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
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// SelectT ...
func (mrTable *TableTypePost) SelectT(queryable mingru.Queryable) (*time.Time, error) {
	var result *time.Time
	err := queryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
