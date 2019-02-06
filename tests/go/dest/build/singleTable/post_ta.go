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

// SelectPostTitleResult ...
type SelectPostTitleResult struct {
	PostID    uint64
	PostTitle string
}

// SelectPostTitle ...
func (da *TableTypePost) SelectPostTitle(queryable dbx.Queryable) (*SelectPostTitleResult, error) {
	result := &SelectPostTitleResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `post`").Scan(&result.PostID, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectPostInfoResult ...
type SelectPostInfoResult struct {
	PostID          uint64
	PostTitle       string
	PostUserID      uint64
	PostUserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable dbx.Queryable) (*SelectPostInfoResult, error) {
	result := &SelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `_main`.`id` AS `postID`, `_main`.`title` AS `postTitle`, `_main`.`user_id` AS `postUserID`, `_join_1`.`url_name` AS `postUserUrlName` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`").Scan(&result.PostID, &result.PostTitle, &result.PostUserID, &result.PostUserUrlName)
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
