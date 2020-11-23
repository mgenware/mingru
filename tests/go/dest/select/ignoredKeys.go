package da

import "github.com/mgenware/mingru-go-lib"

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
	ToUserUrlName string `json:"toUserUrlName"`
}

// SelectT ...
func (da *TableTypePostReply) SelectT(queryable mingru.Queryable) (*PostReplyTableSelectTResult, error) {
	result := &PostReplyTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`url_name` AS `user_url_name`, `join_1`.`id` AS `user_id`, `join_2`.`url_name` AS `to_user_url_name` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.UserUrlName, &result.UserID, &result.ToUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}
