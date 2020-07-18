package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableT1Result ...
type PostTableT1Result struct {
	A bool
}

// T1 ...
func (da *TableTypePost) T1(queryable dbx.Queryable) (*PostTableT1Result, error) {
	result := &PostTableT1Result{}
	err := queryable.QueryRow("SELECT EXISTS(SELECT `title` FROM `db_post`) AS `a` FROM `db_post`").Scan(&result.A)
	if err != nil {
		return nil, err
	}
	return result, nil
}
