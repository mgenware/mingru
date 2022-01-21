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
func (mrTable *TableTypePost) DeleteByID(queryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := queryable.Exec("DELETE FROM "+mrFromTable.MingruSQLName()+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	Content     string
	ID          uint64
	UserUrlName string
}

// SelectPostInfo ...
func (mrTable *TableTypePost) SelectPostInfo(queryable mingru.Queryable, mrFromTable mingru.Table) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := queryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`content`, `join_1`.`url_name` FROM "+mrFromTable.MingruSQLName()+" AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Content, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

// UpdateContent ...
func (mrTable *TableTypePost) UpdateContent(queryable mingru.Queryable, mrFromTable mingru.Table, content string) (int, error) {
	result, err := queryable.Exec("UPDATE "+mrFromTable.MingruSQLName()+" SET `content` = `content` = ?", content)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
