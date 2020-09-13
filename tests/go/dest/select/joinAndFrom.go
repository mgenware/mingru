package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePostCmt ...
type TableTypePostCmt struct {
}

// PostCmt ...
var PostCmt = &TableTypePostCmt{}

// ------------ Actions ------------

// PostCmtTableSelectTResult ...
type PostCmtTableSelectTResult struct {
	CmtContent     string
	CmtCreatedAt   time.Time
	CmtModifiedAt  time.Time
	CmtRplCount    uint
	CmtUserID      uint64
	CmtUserUrlName string
}

// SelectT ...
func (da *TableTypePostCmt) SelectT(queryable mingru.Queryable, postID uint64) (*PostCmtTableSelectTResult, error) {
	result := &PostCmtTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`content` AS `cmtContent`, `join_1`.`created_at` AS `cmtCreatedAt`, `join_1`.`modified_at` AS `cmtModifiedAt`, `join_1`.`rpl_count` AS `cmtRplCount`, `join_1`.`user_id` AS `cmtUserID`, `join_2`.`url_name` AS `cmtUserUrlName` FROM `post_cmt` AS `post_cmt` INNER JOIN `cmt` AS `join_1` ON `join_1`.`id` = `post_cmt`.`cmt_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id` WHERE `post_cmt`.`post_id` = ?", postID).Scan(&result.CmtContent, &result.CmtCreatedAt, &result.CmtModifiedAt, &result.CmtRplCount, &result.CmtUserID, &result.CmtUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}
