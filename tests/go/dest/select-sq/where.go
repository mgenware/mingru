package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableTResult struct {
	Title string
}

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable) (PostTableTResult, error) {
	var result PostTableTResult
	err := mrQueryable.QueryRow("SELECT `title` FROM `db_post` WHERE `user_id` = SELECT MAX(`id`) AS `max_id` FROM `user`").Scan(&result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
