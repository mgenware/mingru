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
	UserUrlName string
	Title       string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`url_name` AS `user_url_name`, `db_post`.`title` AS `title` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.UserUrlName, &result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}
