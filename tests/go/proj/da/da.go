package da

import (
	"github.com/mgenware/go-packagex/database/sqlx"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

/************ Actions ************/
// SelectTResult ...
type SelectTResult struct {
	PostID    uint64
	PostTitle string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable sqlx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&result.PostID, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}
