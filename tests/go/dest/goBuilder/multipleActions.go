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
func (da *TableTypePost) DeleteByID(queryable dbx.Queryable, id uint64) (int, error) {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", id)
	return dbx.GetRowsAffectedIntWithError(result, err)
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	ID          uint64
	Title       string
	UserID      uint64
	UserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable dbx.Queryable) (*PostTableSelectPostInfoResult, error) {
	result := &PostTableSelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `post`.`id` AS `id`, `post`.`title` AS `title`, `post`.`user_id` AS `userID`, `join_1`.`url_name` AS `userUrlName` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.ID, &result.Title, &result.UserID, &result.UserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// PostTableSelectPostTitleResult ...
type PostTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

// SelectPostTitle ...
func (da *TableTypePost) SelectPostTitle(queryable dbx.Queryable) (*PostTableSelectPostTitleResult, error) {
	result := &PostTableSelectPostTitleResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&result.ID, &result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdatePostTitle ...
func (da *TableTypePost) UpdatePostTitle(queryable dbx.Queryable, title string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `title` = ?", title)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
