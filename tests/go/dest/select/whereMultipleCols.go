package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable, id uint64, title string) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` WHERE `id` = ? && `title` != ?", id, title).Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
