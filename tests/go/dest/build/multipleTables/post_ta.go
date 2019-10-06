package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// DeleteByID ...
func (da *TableTypePost) DeleteByID(queryable dbx.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `db_post` WHERE `id` = ?", id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	ID          uint64
	Content     string
	UserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable dbx.Queryable) (*PostTableSelectPostInfoResult, error) {
	result := &PostTableSelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `db_post`.`id` AS `id`, `db_post`.`content` AS `content`, `join_1`.`url_name` AS `userUrlName` FROM `db_post` AS `db_post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `db_post`.`user_id`").Scan(&result.ID, &result.Content, &result.UserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateContent ...
func (da *TableTypePost) UpdateContent(queryable dbx.Queryable, content string) (int, error) {
	result, err := queryable.Exec("UPDATE `db_post` SET `content` = `content` = ?", content)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
