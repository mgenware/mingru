package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGTResult struct {
	Title string
}

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable) (PostAGTResult, error) {
	var result PostAGTResult
	err := mrQueryable.QueryRow("SELECT `title` FROM `db_post` WHERE `user_id` = SELECT MAX(`id`) AS `max_id` FROM `user`").Scan(&result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
