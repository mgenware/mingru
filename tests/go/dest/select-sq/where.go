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

// PostTableTResult ...
type PostTableTResult struct {
	Title string
}

// T ...
func (da *TableTypePost) T(queryable dbx.Queryable) (*PostTableTResult, error) {
	result := &PostTableTResult{}
	err := queryable.QueryRow("SELECT `title` FROM `db_post` WHERE `user_id` = SELECT MAX(`id`) AS `maxID` FROM `user`").Scan(&result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}
