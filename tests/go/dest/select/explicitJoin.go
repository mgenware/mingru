package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	TitleAge int
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := queryable.QueryRow("SELECT `join_1`.`age` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`url_name` = `db_post`.`title`").Scan(&result.TitleAge)
	if err != nil {
		return result, err
	}
	return result, nil
}
