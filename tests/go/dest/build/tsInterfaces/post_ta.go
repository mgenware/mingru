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

// SelectByID ...
func (mrTable *TableTypePost) SelectByID(queryable mingru.Queryable, id uint64) (Res1, error) {
	var result Res1
	err := queryable.QueryRow("SELECT `id` FROM `db_post` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	Content     string
	UserUrlName string
}

// SelectPostInfo ...
func (mrTable *TableTypePost) SelectPostInfo(queryable mingru.Queryable) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := queryable.QueryRow("SELECT `db_post`.`content`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

// SelectTime ...
func (mrTable *TableTypePost) SelectTime(queryable mingru.Queryable) (Res3, error) {
	var result Res3
	err := queryable.QueryRow("SELECT `n_datetime` FROM `db_post`").Scan(&result.NDatetime)
	if err != nil {
		return result, err
	}
	return result, nil
}
