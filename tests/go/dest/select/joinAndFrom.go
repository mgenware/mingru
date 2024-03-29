package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type CmtAGType struct {
}

var Cmt = &CmtAGType{}

// ------------ Actions ------------

type CmtAGSelectTResult struct {
	CmtContent     string
	CmtCreatedAt   time.Time
	CmtModifiedAt  time.Time
	CmtRplCount    uint
	CmtUserID      uint64
	CmtUserUrlName string
}

func (mrTable *CmtAGType) SelectT(mrQueryable mingru.Queryable, postID uint64) (CmtAGSelectTResult, error) {
	var result CmtAGSelectTResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`content`, `join_1`.`created_at`, `join_1`.`modified_at`, `join_1`.`rpl_count`, `join_1`.`user_id`, `join_2`.`url_name` FROM `post_cmt` AS `post_cmt` INNER JOIN `cmt` AS `join_1` ON `join_1`.`id` = `post_cmt`.`cmt_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `join_1`.`user_id` WHERE `post_cmt`.`post_id` = ?", postID).Scan(&result.CmtContent, &result.CmtCreatedAt, &result.CmtModifiedAt, &result.CmtRplCount, &result.CmtUserID, &result.CmtUserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}
