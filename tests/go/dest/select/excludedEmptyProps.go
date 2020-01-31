package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePostReply ...
type TableTypePostReply struct {
}

// PostReply ...
var PostReply = &TableTypePostReply{}

// ------------ Actions ------------

// PostReplyTableSelectTResult ...
type PostReplyTableSelectTResult struct {
	UserUrlName   string `json:"-"`
	UserID        uint64 `json:"-"`
	ToUserUrlName string `json:"toUserUrlName,omitempty"`
}

// SelectT ...
func (da *TableTypePostReply) SelectT(queryable dbx.Queryable) (*PostReplyTableSelectTResult, error) {
	result := &PostReplyTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`url_name` AS `userUrlName`, `join_1`.`id` AS `userID`, `join_2`.`url_name` AS `toUserUrlName` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.UserUrlName, &result.UserID, &result.ToUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}
