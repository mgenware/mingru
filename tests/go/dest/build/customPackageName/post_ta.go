package haha

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableSelectPostTitleResult ...
type PostTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

// SelectPostTitle ...
func (da *TableTypePost) SelectPostTitle(queryable mingru.Queryable) (PostTableSelectPostTitleResult, error) {
	var result PostTableSelectPostTitleResult
	err := queryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
