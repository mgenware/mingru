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
func (da *TableTypePost) SelectT(queryable mingru.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`age` AS `titleAge` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`url_name` = `db_post`.`title` AND `join_1`.`user_id` = `db_post`.`id` AND `join_1`.`my_user_id` = `db_post`.`id`").Scan(&result.TitleAge)
	if err != nil {
		return nil, err
	}
	return result, nil
}
