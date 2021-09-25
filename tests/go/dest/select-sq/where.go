package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableTResult ...
type PostTableTResult struct {
	Title string
}

// T ...
func (da *TableTypePost) T(queryable mingru.Queryable) (PostTableTResult, error) {
	var result PostTableTResult
	err := queryable.QueryRow("SELECT `title` FROM `db_post` WHERE `user_id` = SELECT MAX(`id`) AS `max_id` FROM `user`").Scan(&result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
