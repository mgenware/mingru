package da

import (
	"github.com/mgenware/go-packagex/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectPostTitleResult ...
type PostTableSelectPostTitleResult struct {
	ID    uint64
	Title string
}

// SelectPostTitle ...
func (da *TableTypePost) SelectPostTitle(queryable dbx.Queryable) (*PostTableSelectPostTitleResult, error) {
	result := &PostTableSelectPostTitleResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&result.PostID, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	PostID          uint64
	PostTitle       string
	PostUserID      uint64
	PostUserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable dbx.Queryable) (*PostTableSelectPostInfoResult, error) {
	result := &PostTableSelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `post`.`id` AS `postID`, `post`.`title` AS `postTitle`, `post`.`user_id` AS `postUserID`, `join_1`.`url_name` AS `postUserUrlName` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.PostID, &result.PostTitle, &result.PostUserID, &result.PostUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdatePostTitle ...
func (da *TableTypePost) UpdatePostTitle(queryable dbx.Queryable, postTitle string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `title` = ?", postTitle)
	return dbx.GetRowsAffectedIntWithError(result, err)
}

// DeleteByID ...
func (da *TableTypePost) DeleteByID(queryable dbx.Queryable, postID uint64) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", postID)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
