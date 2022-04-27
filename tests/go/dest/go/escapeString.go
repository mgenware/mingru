package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` WHERE `title` = \"\\\\a\\\"\"").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
