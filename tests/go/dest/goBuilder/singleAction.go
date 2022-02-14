package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
