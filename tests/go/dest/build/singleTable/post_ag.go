package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) DeleteByID(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type PostTableSelectPostInfoResult struct {
	ID          uint64
	Title       string
	UserID      uint64
	UserUrlName string
}

func (mrTable *TableTypePost) SelectPostInfo(mrQueryable mingru.Queryable) (PostTableSelectPostInfoResult, error) {
	var result PostTableSelectPostInfoResult
	err := mrQueryable.QueryRow("SELECT `db_post`.`id`, `db_post`.`title`, `db_post`.`user_id`, `join_1`.`url_name` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Title, &result.UserID, &result.UserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) SelectPostTitle(mrQueryable mingru.Queryable) (PostTableSelectPostTitleResult, error) {
	var result PostTableSelectPostTitleResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *TableTypePost) UpdatePostTitle(mrQueryable mingru.Queryable, title string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = ?", title)
	return mingru.GetRowsAffectedIntWithError(result, err)
}