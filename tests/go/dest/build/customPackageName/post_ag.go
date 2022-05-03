package haha

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectPostTitleResult struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) SelectPostTitle(mrQueryable mingru.Queryable) (PostAGSelectPostTitleResult, error) {
	var result PostAGSelectPostTitleResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
