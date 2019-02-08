import "github.com/mgenware/go-packagex/dbx"

// PostCmtRplTableSelectTResult ...
type PostCmtRplTableSelectTResult struct {
	PostCmtRplUserUrlName   string
	PostCmtRplUserID        uint64
	PostCmtRplToUserUrlName string
}

// SelectT ...
func (da *TableTypePostCmtRpl) SelectT(queryable dbx.Queryable) (*PostCmtRplTableSelectTResult, error) {
	result := &PostCmtRplTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`url_name` AS `postCmtRplUserUrlName`, `join_1`.`id` AS `postCmtRplUserID`, `join_2`.`url_name` AS `postCmtRplToUserUrlName` FROM `post_cmt_rpl` AS `post_cmt_rpl` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post_cmt_rpl`.`user_id` INNER JOIN `user` AS `join_2` ON `join_2`.`id` = `post_cmt_rpl`.`to_user_id`").Scan(&result.PostCmtRplUserUrlName, &result.PostCmtRplUserID, &result.PostCmtRplToUserUrlName)
	if err != nil {
		return nil, err
	}
	return result, nil
}
