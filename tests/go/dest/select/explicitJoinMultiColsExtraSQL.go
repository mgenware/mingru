package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	TitleAge int
}

// SelectT ...
func (mrTable *TableTypePost) SelectT(queryable mingru.Queryable, titleAge int, id uint64) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := queryable.QueryRow("SELECT `join_1`.`age` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`url_name` = `db_post`.`title` AND `join_1`.`my_user_id` = `db_post`.`id` AND `join_1`.`age` = ? AND `db_post`.`id` = ?", titleAge, id).Scan(&result.TitleAge)
	if err != nil {
		return result, err
	}
	return result, nil
}
