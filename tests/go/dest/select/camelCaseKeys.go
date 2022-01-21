package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePostReply ...
type TableTypePostReply struct {
}

// PostReply ...
var PostReply = &TableTypePostReply{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePostReply) MingruSQLName() string {
	return "post_cmt_rpl"
}

// ------------ Actions ------------

// PostReplyTableSelectTResult ...
type PostReplyTableSelectTResult struct {
	Created       time.Time `json:"created"`
	ID            uint64    `json:"id"`
	ToUserUrlName string    `json:"toUserUrlName"`
	UserID        uint64    `json:"userID"`
	UserUrlName   string    `json:"userUrlName"`
}

// SelectT ...
func (mrTable *TableTypePostReply) SelectT(queryable mingru.Queryable) (PostReplyTableSelectTResult, error) {
	var result PostReplyTableSelectTResult
	err := queryable.QueryRow("SELECT `post_cmt_rpl`.`id`, `join_1`.`url_name`, `join_1`.`id`, `join_2`.`url_name`, `post_cmt_rpl`.`created` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.ID, &result.UserUrlName, &result.UserID, &result.ToUserUrlName, &result.Created)
	if err != nil {
		return result, err
	}
	return result, nil
}
