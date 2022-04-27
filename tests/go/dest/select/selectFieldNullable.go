package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) (*time.Time, error) {
	var result *time.Time
	err := mrQueryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
