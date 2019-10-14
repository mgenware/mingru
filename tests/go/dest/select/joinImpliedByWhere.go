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

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable, userUrlName string) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `title` FROM `db_post` WHERE `url_name` = ?", userUrlName).Scan(&result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}
