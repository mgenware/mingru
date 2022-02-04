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

// DeleteByID ...
func (mrTable *TableTypePost) DeleteByID(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	Content     string
	ID          uint64
	UserUrlName string
}

// SelectPostInfo ...
func (mrTable *TableTypePost) SelectPostInfo(mrQueryable mingru.Queryable) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`content`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

// UpdateContent ...
func (mrTable *TableTypePost) UpdateContent(mrQueryable mingru.Queryable, content string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `content` = `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
