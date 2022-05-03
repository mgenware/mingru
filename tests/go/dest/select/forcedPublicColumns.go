package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type RplAGType struct {
}

var Rpl = &RplAGType{}

// ------------ Actions ------------

type RplAGSelectTResult struct {
	Created       time.Time `json:"created,omitempty"`
	ToUserUrlName string    `json:"toUserUrlName,omitempty"`
	UserID        uint64    `json:"userID,omitempty"`
	UserUrlName   string    `json:"userUrlName,omitempty"`
}

func (mrTable *RplAGType) SelectT(mrQueryable mingru.Queryable) (RplAGSelectTResult, error) {
	var result RplAGSelectTResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`url_name`, `join_1`.`id`, `join_2`.`url_name`, `post_cmt_rpl`.`created` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.UserUrlName, &result.UserID, &result.ToUserUrlName, &result.Created)
	if err != nil {
		return result, err
	}
	return result, nil
}
