package haha

import "github.com/mgenware/mingru-go-lib"

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

// PostTableSelectPostTitleResult ...
type PostTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

// SelectPostTitle ...
func (mrTable *TableTypePost) SelectPostTitle(mrQueryable mingru.Queryable) (PostTableSelectPostTitleResult, error) {
	var result PostTableSelectPostTitleResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
