package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// DeleteByID ...
func (da *TableTypePost) DeleteByID(queryable mingru.Queryable, id uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	ID          uint64
	Title       string
	UserID      uint64
	UserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable mingru.Queryable) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := queryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`title`, `db_post`.`user_id`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Title, &result.UserID, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

// PostTableSelectPostTitleResult ...
type PostTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

// SelectPostTitle ...
func (da *TableTypePost) SelectPostTitle(queryable mingru.Queryable) (PostTableSelectPostTitleResult, error) {
	var result PostTableSelectPostTitleResult
	err := queryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

// UpdatePostTitle ...
func (da *TableTypePost) UpdatePostTitle(queryable mingru.Queryable, title string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = ?", title)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
