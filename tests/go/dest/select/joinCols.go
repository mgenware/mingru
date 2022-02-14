package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePostReply struct {
}

var PostReply = &TableTypePostReply{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePostReply) MingruSQLName() string {
	return "post_cmt_rpl"
}

// ------------ Actions ------------

type PostReplyTableSelectTResult struct {
	ToUserUrlName string
	UserID        uint64
	UserUrlName   string
}

func (mrTable *TableTypePostReply) SelectT(mrQueryable mingru.Queryable) (PostReplyTableSelectTResult, error) {
	var result PostReplyTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `join_1`.`url_name`, `join_1`.`id`, `join_2`.`url_name` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.UserUrlName, &result.UserID, &result.ToUserUrlName)
	if err != nil {
		return result, err
	}
	return result, nil
}
