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

// PostTableSelectPostInfoResult ...
type PostTableSelectPostInfoResult struct {
	PostID          uint64
	PostContent     string
	PostUserUrlName string
}

// SelectPostInfo ...
func (da *TableTypePost) SelectPostInfo(queryable dbx.Queryable) (*PostTableSelectPostInfoResult, error) {
	result := &PostTableSelectPostInfoResult{}
	err := queryable.QueryRow("SELECT `post`.`id` AS `postID`, `post`.`content` AS `postContent`, `join_1`.`url_name` AS `postUserUrlName` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.PostID, &result.PostContent, &result.PostUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateContent ...
func (da *TableTypePost) UpdateContent(queryable dbx.Queryable, postContent string) (int, error) {
	result, err := queryable.Exec("UPDATE `post` SET `content` = `content` = ?", postContent)
	return dbx.GetRowsAffectedIntWithError(result, err)
}

// DeleteByID ...
func (da *TableTypePost) DeleteByID(queryable dbx.Queryable, postID uint64) error {
	result, err := queryable.Exec("DELETE FROM `post` WHERE `id` = ?", postID)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
