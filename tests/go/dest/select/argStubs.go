package da

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

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable, id1 int, id2 int) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
