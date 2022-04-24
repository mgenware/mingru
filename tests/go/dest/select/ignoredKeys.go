package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type RplAGType struct {
}

var RplAG = &RplAGType{}

// ------------ Actions ------------

type PostReplyTableSelectTResult struct {
	Created       time.Time `json:"created"`
	ToUserUrlName string    `json:"toUserUrlName"`
	UserID        uint64    `json:"-"`
	UserUrlName   string    `json:"-"`
}

func (mrTable *RplAGType) SelectT(mrQueryable mingru.Queryable) (PostReplyTableSelectTResult, error) {
	var result PostReplyTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`url_name`, `join_1`.`id`, `join_2`.`url_name`, `post_cmt_rpl`.`created` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.UserUrlName, &result.UserID, &result.ToUserUrlName, &result.Created)
	if err != nil {
		return result, err
	}
	return result, nil
}
