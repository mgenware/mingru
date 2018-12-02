package da

import (
	"github.com/mgenware/go-packagex/database/sqlx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// SelectPostInfoResult ...
type SelectPostInfoResult struct {
	PostID          uint64
	PostContent     string
	PostUserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable sqlx.Queryable) (*SelectPostInfoResult, error) {
	result := &SelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `_main`.`id` AS `postID`, `_main`.`content` AS `postContent`, `_join_1`.`url_name` AS `postUserUrlName` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`").Scan(&result.PostID, &result.PostContent, &result.PostUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateContent ...
func (da *TableTypePost) UpdateContent(queryable sqlx.Queryable, postContent string) error {
	_, err := queryable.Exec("UPDATE `post` SET `content` = `content` = ?", postContent)
	if err != nil {
		return err
	}
	return nil
}

// DeleteByID ...
func (da *TableTypePost) DeleteByID(queryable sqlx.Queryable, postID uint64) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", postID)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
