package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) SelectTime(mrQueryable mingru.Queryable) (*time.Time, error) {
	var result *time.Time
	err := mrQueryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
